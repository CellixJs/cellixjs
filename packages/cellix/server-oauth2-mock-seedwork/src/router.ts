import crypto from 'node:crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { exportJWK, generateKeyPair, errors as joseErrors, jwtVerify } from 'jose';
import { buildTokenResponse } from './jwt.ts';
import type { MockOAuth2PortalConfig, MockOAuth2User, MockOAuth2UserStore } from './types.ts';
import { normalizeOrigin, normalizeUrl } from './utils.ts';
import { buildRedirectWithCode, buildEffectiveProfile, normalizeUserInfo, extractClaimsFromPayload } from './helpers.ts';


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

export async function buildOidcRouter(issuerBaseUrl: string, config: MockOAuth2PortalConfig): Promise<express.Router> {
	const router = express.Router();

	const { publicKey, privateKey } = await generateKeyPair('RS256');
	const publicJwk = await exportJWK(publicKey);
	publicJwk.use = 'sig';
	publicJwk.alg = 'RS256';
	publicJwk.kid = publicJwk.kid || 'mock-key';

	const cachedUserProfile = config.getUserProfile();
	// Auth code store: maps one-time auth codes to selected sub and redirectUri
	const authCodeStore = new Map<string, { sub?: string; redirectUri: string }>();
	// Maps short-lived nonces to { redirectUri, state } so user-controlled values never appear in HTML
	const loginSessionStore = new Map<string, { redirectUri: string; state: string }>();
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
		}


		const portalProfile = config.getUserProfile();
		const { sub: upSub, tid: upTid } = portalProfile;
		let resolvedTid: string;
		if (typeof tid === 'string') {
			resolvedTid = tid;
		} else if (typeof upTid === 'string') {
			resolvedTid = upTid;
		} else {
			resolvedTid = 'test-tenant-id';
		}

		// Determine final subject (prefer the code-mapped sub, then portal-profile requested sub)
		const finalSub = resolvedSubFromCode ?? (typeof upSub === 'string' ? upSub : (portalPrefilledSub ?? crypto.randomUUID()));

		let userClaims: Record<string, unknown> | undefined;
		if (config.userStore) {
			const store = config.userStore as MockOAuth2UserStore;
			try {
				if (typeof finalSub === 'string') {
					const user = await store.findBySub(finalSub);
					if (user) userClaims = user.claims;
				}
			} catch (_err) {
				// ignore errors when resolving user
			}
		}

		const effectiveProfile = buildEffectiveProfile(portalProfile, userClaims, finalSub);

		const profile: TokenProfile = {
			...effectiveProfile,
			sub: finalSub,
			aud,
			iss: issuerBaseUrl,
			tid: resolvedTid,
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
		const { state, redirect_uri } = req.query as { state?: string; redirect_uri?: string };
		const requestedRedirectUri = redirect_uri ?? primaryRedirectUri;
		const normalizedRequestedRedirectUri = normalizeUrl(requestedRedirectUri);
		const isAllowed = normalizedAllowedRedirectUris.has(normalizedRequestedRedirectUri);
		if (!isAllowed) {
			res.status(400).send('Invalid redirect_uri');
			return;
		}

		// If userStore exists and no persisted selection is present, redirect to login to choose/authorize a user
		const portalProfile = config.getUserProfile();
		if (config.userStore && !portalProfile.sub) {
			const q = new URLSearchParams({ ...(typeof state === 'string' ? { state } : {}), ...(typeof redirect_uri === 'string' ? { redirect_uri } : {}) }).toString();
			res.setHeader('Location', `/login${q ? `?${q}` : ''}`);
			res.status(302).end();
			return;
		}

		try {
			const code = `mock-auth-code-${crypto.randomUUID()}`;
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

	// If a userStore is provided, expose simple login/signup pages that tie into it.
	router.get('/login', (req, res) => {
		if (!config.userStore) {
			res.status(404).send('Login not available');
			return;
		}
		const { state, redirect_uri } = req.query as { state?: string; redirect_uri?: string };
		const redirect = typeof redirect_uri === 'string' ? redirect_uri : primaryRedirectUri;
		const safeState = typeof state === 'string' ? state : '';
		const nonce = crypto.randomUUID();
		loginSessionStore.set(nonce, { redirectUri: redirect, state: safeState });
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Mock Login</title></head><body>
		<h1>Login</h1>
		<form method="POST" action="/login">
		<input type="hidden" name="nonce" value="${nonce}" />
		<label>Username: <input name="username" /></label><br/>
		<label>Password: <input name="password" type="password" /></label><br/>
		<button type="submit">Login</button>
		</form>
		<p><a href="/signup?nonce=${nonce}">Sign up</a></p>
		</body></html>`);
	});

	router.post('/login', async (req, res) => {
		if (!config.userStore) {
			res.status(404).send('Login not available');
			return;
		}
		const username = req.body.username;
		const password = req.body.password;
		if (typeof username !== 'string' || typeof password !== 'string') {
			res.status(400).json({ error: 'username and password are required' });
			return;
		}
		const loginNonce = typeof req.body.nonce === 'string' ? req.body.nonce : '';
		const loginSession = loginSessionStore.get(loginNonce);
		loginSessionStore.delete(loginNonce);
		const redirect = loginSession?.redirectUri ?? primaryRedirectUri;
		const state = loginSession?.state ?? undefined;
		try {
			const store = config.userStore as MockOAuth2UserStore;
			const user = await store.findByUsername(username);
			if (!user || typeof user.password !== 'string' || user.password !== password) {
				res.status(401).send('Invalid credentials');
				return;
			}
			// Issue a one-time auth code tied to this user and redirect
			try {
				const normalized = normalizeUrl(redirect);
				if (!normalizedAllowedRedirectUris.has(normalized)) {
					res.status(400).send('Invalid redirect_uri');
					return;
				}
				const code = `mock-auth-code-${crypto.randomUUID()}`;
				authCodeStore.set(code, { sub: user.sub, redirectUri: normalized });
				const location = buildRedirectWithCode(redirect, code, state);
				res.setHeader('Location', location);
				res.status(302).end();
			} catch {
				res.status(400).send('Invalid redirect_uri format');
			}
		} catch (_err) {
			res.status(500).send('Login failed');
		}
	});

	router.get('/signup', (req, res) => {
		if (!config.userStore) {
			res.status(404).send('Signup not available');
			return;
		}
		const { state, redirect_uri, nonce: queryNonce } = req.query as { state?: string; redirect_uri?: string; nonce?: string };
		const existingSession = typeof queryNonce === 'string' ? loginSessionStore.get(queryNonce) : undefined;
		if (existingSession && typeof queryNonce === 'string') {
			loginSessionStore.delete(queryNonce);
		}
		const redirect = existingSession?.redirectUri ?? (typeof redirect_uri === 'string' ? redirect_uri : primaryRedirectUri);
		const safeState = existingSession?.state ?? (typeof state === 'string' ? state : '');
		const nonce = crypto.randomUUID();
		loginSessionStore.set(nonce, { redirectUri: redirect, state: safeState });
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Mock Signup</title></head><body>
		<h1>Sign up</h1>
		<form method="POST" action="/signup">
		<input type="hidden" name="nonce" value="${nonce}" />
		<label>Username: <input name="username" /></label><br/>
		<label>Password: <input name="password" type="password" /></label><br/>
		<label>Email: <input name="email" /></label><br/>
		<label>Given name: <input name="given_name" /></label><br/>
		<label>Family name: <input name="family_name" /></label><br/>
		<button type="submit">Sign up</button>
		</form>
		</body></html>`);
	});

	router.post('/signup', async (req, res) => {
		if (!config.userStore) {
			res.status(404).send('Signup not available');
			return;
		}
		const username = req.body.username;
		const password = req.body.password;
		if (typeof username !== 'string' || typeof password !== 'string') {
			res.status(400).json({ error: 'username and password are required' });
			return;
		}
		const email = typeof req.body.email === 'string' ? req.body.email : undefined;
		const given_name = typeof req.body.given_name === 'string' ? req.body.given_name : undefined;
		const family_name = typeof req.body.family_name === 'string' ? req.body.family_name : undefined;
		const signupNonce = typeof req.body.nonce === 'string' ? req.body.nonce : '';
		const signupSession = loginSessionStore.get(signupNonce);
		loginSessionStore.delete(signupNonce);
		const redirect = signupSession?.redirectUri ?? primaryRedirectUri;
		const state = signupSession?.state ?? undefined;
		try {
			const claimsObj: { email?: unknown; given_name?: unknown; family_name?: unknown; [k: string]: unknown } = {};
			if (email) claimsObj.email = email;
			if (given_name) claimsObj.given_name = given_name;
			if (family_name) claimsObj.family_name = family_name;
			const newUser: MockOAuth2User = { username, sub: crypto.randomUUID(), password, claims: claimsObj };
			const store = config.userStore as MockOAuth2UserStore;
			await store.addUser(newUser);
			// Issue a one-time auth code tied to this newly created user and redirect
			try {
				const normalized = normalizeUrl(redirect);
				if (!normalizedAllowedRedirectUris.has(normalized)) {
					res.status(400).send('Invalid redirect_uri');
					return;
				}
				const code = `mock-auth-code-${crypto.randomUUID()}`;
				authCodeStore.set(code, { sub: newUser.sub, redirectUri: normalized });
				const location = buildRedirectWithCode(redirect, code, state);
				res.setHeader('Location', location);
				res.status(302).end();
			} catch {
				res.status(400).send('Invalid redirect_uri format');
			}
		} catch (_err) {
			res.status(500).send('Signup failed');
		}
	});

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
