import crypto from 'node:crypto';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { exportJWK, generateKeyPair, errors as joseErrors, jwtVerify } from 'jose';
import { buildEffectiveProfile, buildRedirectWithCode, extractClaimsFromPayload, normalizeUserInfo } from './helpers.ts';
import { buildTokenResponse } from './jwt.ts';
import { debugLog } from './logger.ts';
import { createLoginHandlers } from './login-handlers.ts';
import { createTtlStore } from './ttl-store.ts';
import type { MockOAuth2PortalConfig, MockOAuth2UserStore } from './types.ts';
import { AUTH_CODE_PREFIX, normalizeOrigin, normalizeUrl } from './utils.ts';

interface TokenProfile {
	aud: string;
	sub: string;
	iss: string;
	email?: string;
	given_name?: string;
	family_name?: string;
	tid?: string;
	[key: string]: unknown;
}

export const AUTH_CODE_TTL_MS = 10 * 60 * 1000;

/**
 * Builds an Express router that exposes the mock OIDC discovery, authorize, login,
 * signup, token, userinfo, and logout endpoints for one issuer.
 *
 * @param issuerBaseUrl - Fully qualified issuer base URL for the mounted router.
 * @param config - Portal configuration, including redirects, claims, and optional async user store.
 * @returns A promise that resolves to a configured Express router.
 *
 * @example
 * ```ts
 * const router = await buildOidcRouter('http://127.0.0.1:38200/portal', {
 *   allowedRedirectUris: new Set(['http://localhost:3000/callback']),
 *   allowedRedirectUri: 'http://localhost:3000/callback',
 *   redirectUriToAudience: new Map([['http://localhost:3000/callback', 'mock-client']]),
 *   getUserProfile: () => ({ email: 'test@example.com' }),
 * });
 * ```
 */
export async function buildOidcRouter(issuerBaseUrl: string, config: MockOAuth2PortalConfig): Promise<express.Router> {
	const router = express.Router();

	const { publicKey, privateKey } = await generateKeyPair('RS256');
	const publicJwk = await exportJWK(publicKey);
	publicJwk.use = 'sig';
	publicJwk.alg = 'RS256';
	publicJwk.kid = publicJwk.kid || 'mock-key';

	const cachedUserProfile = config.getUserProfile();
	// Auth code store: maps one-time auth codes to selected sub, redirectUri, and OIDC nonce
	const authCodeStore = createTtlStore<{ sub?: string; redirectUri: string; nonce?: string }>(AUTH_CODE_TTL_MS);
	// Maps short-lived nonces to redirect and authorization params so user-controlled values never appear in HTML
	const loginSessionStore = createTtlStore<{ redirectUri: string; state: string; nonce?: string }>(AUTH_CODE_TTL_MS);
	// For prefilled portal profile when no userStore, we may use portal sub as default when issuing codes without an explicit user selection.
	const portalPrefilledSub = config.userStore ? undefined : (cachedUserProfile.sub ?? crypto.randomUUID());

	const normalizedAllowedRedirectUris = new Set<string>([...config.allowedRedirectUris].map((u) => normalizeUrl(u)));

	let primaryRedirectUri: string;
	if (normalizedAllowedRedirectUris.size > 0) {
		const iter = normalizedAllowedRedirectUris.values();
		const first = iter.next().value;
		primaryRedirectUri = first ?? normalizeUrl(config.allowedRedirectUri);
		if (!first) {
			normalizedAllowedRedirectUris.add(primaryRedirectUri);
		}
	} else {
		primaryRedirectUri = normalizeUrl(config.allowedRedirectUri);
		normalizedAllowedRedirectUris.add(primaryRedirectUri);
	}

	const normalizedRedirectUriToAudience = new Map<string, string>();
	for (const [key, val] of config.redirectUriToAudience.entries()) {
		normalizedRedirectUriToAudience.set(normalizeUrl(key), val);
	}

	const allowedAudiences = new Set(normalizedRedirectUriToAudience.values());
	allowedAudiences.add('mock-client');

	const normalizedAllowedOrigins = new Set<string>([...normalizedAllowedRedirectUris].map((u) => normalizeOrigin(u)));

	// Serve JWKS endpoint from Express
	router.get('/.well-known/jwks.json', (_req, res) => {
		res.json({ keys: [publicJwk] });
	});

	router.use(express.urlencoded({ extended: true }));
	router.use(express.json());

	// CORS middleware (kept minimal here; manager or caller may adapt)
	router.use((req, res, next) => {
		const originHeader = req.headers.origin;
		let allowOrigin = false;
		let allowedOriginValue: string | undefined;
		if (typeof originHeader === 'string') {
			try {
				const originUrl = new URL(originHeader);
				const { hostname } = originUrl;
				const normalizedOrigin = normalizeOrigin(originHeader);

				if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname.endsWith('.localhost') || normalizedAllowedOrigins.has(normalizedOrigin)) {
					allowOrigin = true;
					allowedOriginValue = normalizedOrigin;
				}
			} catch {
				// ignore parse errors and deny
			}
		}

		const allowMethods = 'GET,POST,OPTIONS';
		const requestHeaders = (req.get('access-control-request-headers') ?? '') as string;
		const allowHeaders = requestHeaders && requestHeaders.length > 0 ? requestHeaders : 'Content-Type,Authorization';

		if (req.method === 'OPTIONS') {
			res.setHeader('Access-Control-Allow-Methods', allowMethods);
			res.setHeader('Access-Control-Allow-Headers', allowHeaders);
			res.setHeader('Vary', 'Origin');
			if (allowOrigin && allowedOriginValue) res.setHeader('Access-Control-Allow-Origin', allowedOriginValue);
			res.sendStatus(204);
			return;
		}

		if (allowOrigin && allowedOriginValue) {
			res.setHeader('Access-Control-Allow-Origin', allowedOriginValue);
			res.setHeader('Vary', 'Origin');
		}
		next();
	});

	router.post('/token', async (req, res) => {
		const { grant_type, tid, code } = req.body as {
			grant_type?: string;
			refresh_token?: string;
			tid?: string;
			code?: string;
		};

		if (grant_type !== 'authorization_code') {
			res.status(400).json({
				error: 'unsupported_grant_type',
				error_description: 'Only grant_type=authorization_code is supported by this mock server',
			});
			return;
		}

		if (typeof code !== 'string') {
			res.status(400).json({ error: 'invalid_request', error_description: 'code must be a string' });
			return;
		}

		const defaultAud = normalizedRedirectUriToAudience.get(primaryRedirectUri) ?? 'mock-client';
		let aud = defaultAud;
		let resolvedSubFromCode: string | undefined;
		// check one-time mapping first
		const mapping = authCodeStore.get(code);
		const resolvedNonce = mapping?.nonce;
		if (mapping) {
			try {
				const normalizedDecoded = normalizeUrl(mapping.redirectUri);
				if (normalizedAllowedRedirectUris.has(normalizedDecoded)) {
					aud = normalizedRedirectUriToAudience.get(normalizedDecoded) ?? aud;
				}
			} catch (_err) {
				// ignore
			}
			// consume one-time code
			authCodeStore.delete(code);
			resolvedSubFromCode = mapping.sub;
		} else if (code.startsWith(AUTH_CODE_PREFIX)) {
			// Code has expected prefix but no mapping (expired or invalid)
			res.status(400).json({ error: 'invalid_grant', error_description: 'invalid or expired authorization code' });
			return;
		} else {
			// Code does not have expected prefix, reject
			res.status(400).json({ error: 'invalid_grant', error_description: 'invalid or expired authorization code' });
			return;
		}

		const portalProfile = config.getUserProfile();
		const { sub: upSub, tid: upTid } = portalProfile;

		// Determine final subject (prefer the code-mapped sub, then portal-profile requested sub)
		const finalSub = resolvedSubFromCode ?? (typeof upSub === 'string' ? upSub : (portalPrefilledSub ?? crypto.randomUUID()));

		let userClaims: (Record<string, unknown> & { tid?: string }) | undefined;
		if (config.userStore) {
			const store = config.userStore as MockOAuth2UserStore;
			try {
				if (typeof finalSub === 'string') {
					const user = await store.findBySub(finalSub);
					if (user) userClaims = user.claims;
				}
			} catch (err) {
				// User store lookup failed (e.g., corrupt data, duplicate entries). Return 500 with OAuth2-compliant error.
				debugLog('[server-oauth2-mock] /token user store lookup failed', { error: err instanceof Error ? err.message : String(err), finalSub });
				res.status(500).json({ error: 'server_error', error_description: `Failed to resolve user claims for sub=${finalSub}` });
				return;
			}
		}

		const effectiveProfile = buildEffectiveProfile(portalProfile, userClaims, finalSub);
		// Prefer explicit request override (tid param), then tid from merged effective profile (portal + user claims), then portal default
		const _ep = effectiveProfile as Record<string, unknown>;
		// biome-ignore lint/complexity/useLiteralKeys: Required for TypeScript index signature access
		const mergedTid = typeof _ep['tid'] === 'string' ? (_ep['tid'] as string) : undefined;
		const resolvedTid = typeof tid === 'string' ? tid : (mergedTid ?? (typeof upTid === 'string' ? upTid : 'test-tenant-id'));

		const profile: TokenProfile = {
			...effectiveProfile,
			sub: finalSub,
			aud,
			iss: issuerBaseUrl,
			tid: resolvedTid,
			...(resolvedNonce !== undefined ? { nonce: resolvedNonce } : {}),
		};
		const tokenResponse = await buildTokenResponse(profile, privateKey, publicJwk, issuerBaseUrl);
		res.json(tokenResponse);
	});

	router.get('/.well-known/openid-configuration', (_req, res) => {
		res.json({
			issuer: issuerBaseUrl,
			authorization_endpoint: `${issuerBaseUrl}/authorize`,
			token_endpoint: `${issuerBaseUrl}/token`,
			userinfo_endpoint: `${issuerBaseUrl}/userinfo`,
			jwks_uri: `${issuerBaseUrl}/.well-known/jwks.json`,
			end_session_endpoint: `${issuerBaseUrl}/logout`,
			response_types_supported: ['code', 'token'],
			subject_types_supported: ['public'],
			id_token_signing_alg_values_supported: ['RS256'],
			scopes_supported: ['openid', 'profile', 'email'],
			token_endpoint_auth_methods_supported: ['client_secret_post'],
			claims_supported: ['sub', 'email', 'name', 'aud'],
		});
	});

	router.get('/authorize', (req, res) => {
		const { state, redirect_uri, nonce } = req.query as { state?: string; redirect_uri?: string; nonce?: string };
		const requestedRedirectUri = redirect_uri ?? primaryRedirectUri;
		const normalizedRequestedRedirectUri = normalizeUrl(requestedRedirectUri);
		const isAllowed = normalizedAllowedRedirectUris.has(normalizedRequestedRedirectUri);
		if (!isAllowed) {
			res.status(400).send('Invalid redirect_uri');
			return;
		}

		// Structured debug logging
		debugLog('[server-oauth2-mock] GET /authorize', {
			portal: issuerBaseUrl,
			state: typeof state === 'string' ? state : undefined,
			redirectUri: requestedRedirectUri,
			sessionNonce: typeof nonce === 'string' ? nonce : undefined,
		});

		// If userStore exists, redirect to login to choose/authorize a user.
		if (config.userStore) {
			const forward: Record<string, string> = typeof nonce === 'string' ? { nonce } : {};
			// Whitelist known OIDC and PKCE params and apply size limits to prevent oversized redirects
			const allowedParams = new Set(['state', 'redirect_uri', 'response_type', 'client_id', 'scope', 'response_mode', 'code_challenge', 'code_challenge_method']);
			for (const [key, value] of Object.entries(req.query)) {
				if (!allowedParams.has(key) || typeof value !== 'string') continue;
				// Apply 2048 limit for state param, reasonable defaults for others
				if (key === 'state' && value.length > 2048) continue;
				if (value.length > 4096) continue; // Prevent oversized query strings
				forward[key] = value;
			}
			const q = new URLSearchParams(forward).toString();
			res.setHeader('Location', `${issuerBaseUrl}/login${q ? `?${q}` : ''}`);
			res.status(302).end();
			return;
		}

		try {
			const code = `${AUTH_CODE_PREFIX}${crypto.randomUUID()}`;
			{
				const entry: { redirectUri: string; sub?: string } = { redirectUri: normalizedRequestedRedirectUri };
				if (typeof portalPrefilledSub === 'string') entry.sub = portalPrefilledSub;
				authCodeStore.set(code, entry);
			}
			const location = buildRedirectWithCode(requestedRedirectUri, code, typeof state === 'string' ? state : undefined);
			res.setHeader('Location', location);
			res.status(302).end();
		} catch {
			res.status(400).send('Invalid redirect_uri format');
		}
	});

	createLoginHandlers({
		config,
		issuerBaseUrl,
		primaryRedirectUri,
		normalizedAllowedRedirectUris,
		loginSessionStore,
		authCodeStore,
		normalizeUrl,
		buildRedirectWithCode,
		logger: { debug: debugLog },
	}).registerRoutes(router);

	const userinfoRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many /userinfo requests, please try again later.' });

	router.get('/userinfo', userinfoRateLimiter as unknown as Parameters<typeof router.get>[1], async (req, res) => {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith('Bearer ')) {
			res.status(401).json({ error: 'unauthorized' });
			return;
		}
		const token = authHeader.substring(7);
		const parts = token.split('.');
		if (parts.length !== 3 || !parts[1]) {
			res.status(401).json({ error: 'invalid_token', error_description: 'malformed_bearer_token' });
			return;
		}
		try {
			const { payload } = await jwtVerify(token, publicKey, { issuer: issuerBaseUrl, audience: Array.from(allowedAudiences) });
			if (!payload.sub) {
				res.status(401).json({ error: 'invalid_token', error_description: 'missing_sub_claim' });
				return;
			}
			if (!payload.iss) {
				res.status(401).json({ error: 'invalid_token', error_description: 'missing_iss_claim' });
				return;
			}
			if (!payload.aud) {
				res.status(401).json({ error: 'invalid_token', error_description: 'missing_aud_claim' });
				return;
			}
			const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
			if (!sub) {
				res.status(401).json({ error: 'invalid_token', error_description: 'missing_sub_claim' });
				return;
			}

			// Resolve full user claims from userStore when available; otherwise fallback to payload/profile fusion
			let effectiveProfile: Record<string, unknown> = {};
			const portalProfile = config.getUserProfile();
			if (config.userStore) {
				try {
					const store = config.userStore as MockOAuth2UserStore;
					const user = await store.findBySub(sub);
					if (user) {
						effectiveProfile = buildEffectiveProfile(portalProfile, user.claims, user.sub);
					} else {
						effectiveProfile = buildEffectiveProfile(portalProfile, extractClaimsFromPayload(payload as Record<string, unknown>), sub);
					}
				} catch (_err) {
					effectiveProfile = buildEffectiveProfile(portalProfile, extractClaimsFromPayload(payload as Record<string, unknown>), sub);
				}
			} else {
				effectiveProfile = buildEffectiveProfile(portalProfile, extractClaimsFromPayload(payload as Record<string, unknown>), sub);
			}

			const normalized = normalizeUserInfo(effectiveProfile);
			res.json(normalized);
		} catch (error: unknown) {
			if (error instanceof joseErrors.JWTExpired) {
				res.status(401).json({ error: 'invalid_token', error_description: 'token_expired' });
				return;
			}
			res.status(401).json({ error: 'invalid_token', error_description: 'token_verification_failed' });
		}
	});

	router.get('/logout', (req, res) => {
		const { post_logout_redirect_uri, state } = req.query as { post_logout_redirect_uri?: string; state?: string };
		// Debug
		debugLog('[server-oauth2-mock] GET /logout', { portal: issuerBaseUrl });
		if (!post_logout_redirect_uri) {
			res.status(204).end();
			return;
		}
		try {
			const redirectUrl = new URL(post_logout_redirect_uri);
			const origin = normalizeOrigin(post_logout_redirect_uri);
			const isLocalHost = redirectUrl.hostname === '127.0.0.1' || redirectUrl.hostname === 'localhost' || redirectUrl.hostname.endsWith('.localhost') || normalizedAllowedOrigins.has(origin);
			if (!isLocalHost) {
				res.status(400).send('Invalid post_logout_redirect_uri');
				return;
			}
			if (typeof state === 'string' && state.length <= 2048) redirectUrl.searchParams.set('state', state);
			res.setHeader('Location', redirectUrl.toString());
			res.status(302).end();
		} catch {
			res.status(400).send('Invalid post_logout_redirect_uri');
		}
	});

	return router;
}
