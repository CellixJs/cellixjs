import crypto from 'node:crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { exportJWK, generateKeyPair, errors as joseErrors, jwtVerify } from 'jose';
import { buildTokenResponse } from './jwt.ts';
import type { MockOAuth2PortalConfig } from './types.ts';
import { normalizeOrigin, normalizeUrl } from './utils.ts';

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
	const persistedSub = cachedUserProfile.sub ?? crypto.randomUUID();

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
		const requestHeaders = (req.headers['access-control-request-headers'] ?? '') as string;
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

		if (code.startsWith('mock-auth-code-')) {
			try {
				const base64Part = code.replace('mock-auth-code-', '');
				const decodedRedirectUri = Buffer.from(base64Part, 'base64').toString('utf-8');
				const normalizedDecoded = normalizeUrl(decodedRedirectUri);
				if (normalizedAllowedRedirectUris.has(normalizedDecoded)) {
					aud = normalizedRedirectUriToAudience.get(normalizedDecoded) ?? aud;
				}
			} catch (error) {
				console.error('Failed to decode redirect_uri from code:', error);
			}
		}

		const userProfile = config.getUserProfile();
		const { sub: upSub, email: upEmail, given_name: upGiven, family_name: upFamily, tid: upTid, ...extra } = userProfile;
		let resolvedTid: string;
		if (typeof tid === 'string') {
			resolvedTid = tid;
		} else if (typeof upTid === 'string') {
			resolvedTid = upTid;
		} else {
			resolvedTid = 'test-tenant-id';
		}
		const profile: TokenProfile = {
			...extra,
			aud,
			sub: typeof upSub === 'string' ? upSub : persistedSub,
			iss: issuerBaseUrl,
			...(typeof upEmail === 'string' ? { email: upEmail } : {}),
			...(typeof upGiven === 'string' ? { given_name: upGiven } : {}),
			...(typeof upFamily === 'string' ? { family_name: upFamily } : {}),
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

		try {
			const code = `mock-auth-code-${Buffer.from(normalizedRequestedRedirectUri).toString('base64')}`;
			const redirectUrl = new URL(requestedRedirectUri);
			redirectUrl.searchParams.set('code', code);
			if (typeof state === 'string' && state.length <= 2048) redirectUrl.searchParams.set('state', state);
			res.setHeader('Location', redirectUrl.toString());
			res.status(302).end();
		} catch {
			res.status(400).send('Invalid redirect_uri format');
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
			const { email: emailProp, given_name: givenNameProp, family_name: familyNameProp } = payload as Record<string, unknown>;
			const email = typeof emailProp === 'string' ? emailProp : undefined;
			const givenName = typeof givenNameProp === 'string' ? givenNameProp : undefined;
			const familyName = typeof familyNameProp === 'string' ? familyNameProp : undefined;
			const username = email?.includes('@') ? email.split('@')[0] : payload.sub;
			res.json({ sub: payload.sub, email, given_name: givenName, family_name: familyName, name: givenName && familyName ? `${givenName} ${familyName}` : (givenName ?? familyName ?? username), username });
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
