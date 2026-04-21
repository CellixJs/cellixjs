import crypto, { type KeyObject, type webcrypto } from 'node:crypto';
import type { Server } from 'node:http';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { exportJWK, exportPKCS8, generateKeyPair, type JWK, errors as joseErrors, jwtVerify, SignJWT } from 'jose';

interface TokenProfile {
	aud: string;
	sub: string;
	iss: string;
	email: string;
	given_name: string;
	family_name: string;
	tid: string;
}

export interface MockOAuth2UserProfile {
	email: string;
	given_name: string;
	family_name: string;
	sub?: string;
	tid?: string;
}

export interface MockOAuth2ServerConfig {
	port: number;
	baseUrl: string;
	host?: string;
	allowedRedirectUris: Set<string>;
	allowedRedirectUri: string;
	redirectUriToAudience: Map<string, string>;
	getUserProfile: () => MockOAuth2UserProfile;
}

async function buildTokenResponse(profile: TokenProfile, privateKey: webcrypto.CryptoKey | KeyObject | JWK | Uint8Array, jwk: { alg?: string; kid?: string }, baseUrl: string) {
	const now = Math.floor(Date.now() / 1000);
	const expiresIn = 3600;
	const exp = now + expiresIn;

	// Manually sign the id_token as a JWT with all claims using jose
	const idTokenPayload = {
		iss: baseUrl,
		sub: profile.sub,
		aud: profile.aud,
		email: profile.email,
		given_name: profile.given_name,
		family_name: profile.family_name,
		tid: profile.tid,
		exp,
		iat: now,
		typ: 'id_token',
	};
	const alg = jwk.alg || 'RS256';
	const id_token = await new SignJWT(idTokenPayload)
		.setProtectedHeader({ alg, kid: jwk.kid || '', typ: 'JWT' })
		.setIssuedAt(now)
		.setExpirationTime(exp)
		.sign(privateKey);

	// Manually sign the access_token as a JWT with all claims using jose
	const accessTokenPayload = {
		iss: baseUrl,
		sub: profile.sub,
		aud: profile.aud,
		email: profile.email,
		given_name: profile.given_name,
		family_name: profile.family_name,
		tid: profile.tid,
		exp,
		iat: now,
		typ: 'access_token',
	};
	const access_token = await new SignJWT(accessTokenPayload)
		.setProtectedHeader({ alg, kid: jwk.kid || '', typ: 'JWT' })
		.setIssuedAt(now)
		.setExpirationTime(exp)
		.sign(privateKey);

	// Generate a new refresh token for each token response (mock server does not persist refresh tokens)
	const refresh_token = crypto.randomUUID();
	return {
		id_token,
		session_state: null,
		access_token,
		refresh_token,
		token_type: 'Bearer',
		scope: 'openid',
		profile: {
			exp,
			ver: '1.0',
			iss: baseUrl,
			sub: profile.sub,
			aud: profile.aud,
			iat: now,
			email: profile.email,
			given_name: profile.given_name,
			family_name: profile.family_name,
			tid: profile.tid,
		},
		expires_at: exp,
	};
}

const normalizeUrl = (value: string) => {
	try {
		const url = new URL(value);
		const pathname = url.pathname.replace(/\/$/, '') || '/';
		const params = new URLSearchParams(url.search);
		params.sort();
		const search = params.toString() ? `?${params.toString()}` : '';
		return `${url.origin}${pathname}${search}`;
	} catch {
		return value;
	}
};

// Normalize an origin (scheme + host + port) from a full URL string
const normalizeOrigin = (value: string) => {
	try {
		const url = new URL(value);
		return `${url.protocol}//${url.host}`;
	} catch {
		return value;
	}
};

export interface MockOAuth2ServerHandle {
	server: Server;
	disposer: {
		stop: () => Promise<void>;
	};
}

export async function startMockOAuth2Server(config: MockOAuth2ServerConfig): Promise<MockOAuth2ServerHandle> {
	const app = express();
	app.disable('x-powered-by');

	const { publicKey, privateKey } = await generateKeyPair('RS256');
	const publicJwk = await exportJWK(publicKey);
	const pkcs8 = await exportPKCS8(privateKey);
	const keyObject = crypto.createPrivateKey({
		key: pkcs8,
		format: 'pem',
		type: 'pkcs8',
	});
	publicJwk.use = 'sig';
	publicJwk.alg = 'RS256';
	publicJwk.kid = publicJwk.kid || 'mock-key';

	// Cache the sub value once at startup to ensure session persistence across multiple logins
	const cachedUserProfile = config.getUserProfile();
	const persistedSub = cachedUserProfile.sub ?? crypto.randomUUID();

	// Precompute normalized redirect URIs and origin sets once at startup to avoid
	// per-request overhead and to ensure consistent normalization logic across
	// `/authorize` and `/token` handlers.
	const normalizedAllowedRedirectUris = new Set<string>([...config.allowedRedirectUris].map((u) => normalizeUrl(u)));

	// Derive a single primary redirect URI from the configured set to avoid
	// divergence between `allowedRedirectUris` and a separate `allowedRedirectUri` field.
	// Prefer the first value from the normalized set when available. If the set is
	// empty, fall back to the configured singular value.
	let primaryRedirectUri: string;
	if (normalizedAllowedRedirectUris.size > 0) {
		// Extract the first value from the Set iterator. Use a safe fallback
		// in case the iterator yields `undefined` (defensive, though size>0
		// should guarantee a value).
		const iter = normalizedAllowedRedirectUris.values();
		const first = iter.next().value;
		primaryRedirectUri = first ?? normalizeUrl(config.allowedRedirectUri);
		if (!first) {
			// ensure the fallback primary is present in the normalized set
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

	// Derive the set of allowed audiences from the configured redirect-uri->audience map.
	// Include a default mock client id so tokens issued with the fallback audience remain valid.
	const allowedAudiences = new Set(normalizedRedirectUriToAudience.values());
	allowedAudiences.add('mock-client');

	const normalizedAllowedOrigins = new Set<string>([...normalizedAllowedRedirectUris].map((u) => normalizeOrigin(u)));

	// Serve JWKS endpoint from Express
	app.get('/.well-known/jwks.json', (_req, res) => {
		res.json({ keys: [publicJwk] });
	});

	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());
	// CORS: only allow local development origins (127.0.0.1, localhost, *.localhost)
	// and any origins derived from the configured redirect URIs. This keeps the
	// server suitable for local testing while avoiding a permissive "*" policy.
	app.use((req, res, next) => {
		const originHeader = req.headers.origin;

		let allowOrigin = false;
		if (typeof originHeader === 'string') {
			try {
				const originUrl = new URL(originHeader);
				const { hostname } = originUrl;

				// Allow explicit localhost addresses, any subdomain under `.localhost`,
				// or configured redirect-origin matches.
				if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname.endsWith('.localhost') || normalizedAllowedOrigins.has(normalizeOrigin(originHeader))) {
					allowOrigin = true;
				}
			} catch {
				// ignore parse errors and deny
			}
		}

		if (allowOrigin && typeof originHeader === 'string') {
			res.setHeader('Access-Control-Allow-Origin', originHeader);
			res.setHeader('Vary', 'Origin');
		}

		res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

		if (req.method === 'OPTIONS') {
			res.sendStatus(200);
			return;
		}
		next();
	});

	app.post('/token', async (req, res) => {
		const { grant_type, tid, code } = req.body as {
			grant_type?: string;
			refresh_token?: string;
			tid?: string;
			code?: string;
		};

		// This mock server only supports the authorization_code flow for token issuance.
		if (grant_type !== 'authorization_code') {
			res.status(400).json({
				error: 'unsupported_grant_type',
				error_description: 'Only grant_type=authorization_code is supported by this mock server',
			});
			return;
		}

		if (typeof code !== 'string') {
			res.status(400).json({
				error: 'invalid_request',
				error_description: 'code must be a string',
			});
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

		const profile: TokenProfile = {
			aud,
			sub: persistedSub,
			iss: config.baseUrl,
			email: userProfile.email,
			given_name: userProfile.given_name,
			family_name: userProfile.family_name,
			tid: tid ?? userProfile.tid ?? 'test-tenant-id',
		};
		const tokenResponse = await buildTokenResponse(profile, keyObject, publicJwk, config.baseUrl);
		res.json(tokenResponse);
	});

	app.get('/.well-known/openid-configuration', (_req, res) => {
		res.json({
			issuer: config.baseUrl,
			authorization_endpoint: `${config.baseUrl}/authorize`,
			token_endpoint: `${config.baseUrl}/token`,
			userinfo_endpoint: `${config.baseUrl}/userinfo`,
			jwks_uri: `${config.baseUrl}/.well-known/jwks.json`,
			end_session_endpoint: `${config.baseUrl}/logout`,
			response_types_supported: ['code', 'token'],
			subject_types_supported: ['public'],
			id_token_signing_alg_values_supported: ['RS256'],
			scopes_supported: ['openid', 'profile', 'email'],
			token_endpoint_auth_methods_supported: ['client_secret_post'],
			claims_supported: ['sub', 'email', 'name', 'aud'],
		});
	});

	app.get('/authorize', (req, res) => {
		const { state, redirect_uri } = req.query as { state?: string; redirect_uri?: string };
		const requestedRedirectUri = redirect_uri ?? primaryRedirectUri;
		const normalizedRequestedRedirectUri = normalizeUrl(requestedRedirectUri);
		const isAllowed = normalizedAllowedRedirectUris.has(normalizedRequestedRedirectUri);
		if (!isAllowed) {
			res.status(400).send('Invalid redirect_uri');
			return;
		}

		try {
			// Use the normalized redirect URI when embedding into the auth code so that
			// the `/token` handler can later decode and perform audience lookup on a
			// normalized value consistent with validation.
			const code = `mock-auth-code-${Buffer.from(normalizedRequestedRedirectUri).toString('base64')}`;
			const redirectUrl = new URL(requestedRedirectUri);
			redirectUrl.searchParams.set('code', code);
			if (typeof state === 'string' && state.length <= 2048) {
				redirectUrl.searchParams.set('state', state);
			}
			res.setHeader('Location', redirectUrl.toString());
			res.status(302).end();
		} catch {
			res.status(400).send('Invalid redirect_uri format');
		}
	});

	// Rate limit the /userinfo endpoint to prevent brute force attacks on JWT validation
	const userinfoRateLimiter = rateLimit({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 100, // limit each IP to 100 requests per windowMs
		message: 'Too many /userinfo requests, please try again later.',
	});

	app.get('/userinfo', userinfoRateLimiter as unknown as Parameters<typeof app.get>[1], async (req, res) => {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith('Bearer ')) {
			res.status(401).json({ error: 'unauthorized' });
			return;
		}

		const token = authHeader.substring(7);
		const parts = token.split('.');
		if (parts.length !== 3 || !parts[1]) {
			res.status(401).json({
				error: 'invalid_token',
				error_description: 'malformed_bearer_token',
			});
			return;
		}

		try {
			// Verify token using the same RSA public key that was used to sign it in /token.
			// Validate issuer and audience to better match real IdP behaviour and surface client misconfiguration.
			const { payload } = await jwtVerify(token, publicKey, {
				issuer: config.baseUrl,
				audience: Array.from(allowedAudiences),
			});

			// Ensure required claims are present, even in mock mode
			if (!payload.sub) {
				res.status(401).json({
					error: 'invalid_token',
					error_description: 'missing_sub_claim',
				});
				return;
			}

			if (!payload.iss) {
				res.status(401).json({
					error: 'invalid_token',
					error_description: 'missing_iss_claim',
				});
				return;
			}

			if (!payload.aud) {
				res.status(401).json({
					error: 'invalid_token',
					error_description: 'missing_aud_claim',
				});
				return;
			}

			const { email: emailProp, given_name: givenNameProp, family_name: familyNameProp } = payload as Record<string, unknown>;
			const email = typeof emailProp === 'string' ? emailProp : undefined;
			const givenName = typeof givenNameProp === 'string' ? givenNameProp : undefined;
			const familyName = typeof familyNameProp === 'string' ? familyNameProp : undefined;

			const username = email?.includes('@') ? email.split('@')[0] : payload.sub;

			res.json({
				sub: payload.sub,
				email,
				given_name: givenName,
				family_name: familyName,
				name: givenName && familyName ? `${givenName} ${familyName}` : (givenName ?? familyName ?? username),
				username,
			});
		} catch (error: unknown) {
			if (error instanceof joseErrors.JWTExpired) {
				res.status(401).json({
					error: 'invalid_token',
					error_description: 'token_expired',
				});
				return;
			}

			res.status(401).json({
				error: 'invalid_token',
				error_description: 'token_verification_failed',
			});
		}
	});

	app.get('/logout', (req, res) => {
		const { post_logout_redirect_uri, state } = req.query as {
			post_logout_redirect_uri?: string;
			state?: string;
		};

		if (!post_logout_redirect_uri) {
			res.status(204).end();
			return;
		}

		try {
			const redirectUrl = new URL(post_logout_redirect_uri);

			// Restrict logout redirect targets to local development origins to
			// remain consistent with `/authorize` and avoid surprising open-redirect
			// behaviour, even in a mock server.
			const origin = normalizeOrigin(post_logout_redirect_uri);
			const isLocalHost = redirectUrl.hostname === '127.0.0.1' || redirectUrl.hostname === 'localhost' || redirectUrl.hostname.endsWith('.localhost') || normalizedAllowedOrigins.has(origin);

			if (!isLocalHost) {
				res.status(400).send('Invalid post_logout_redirect_uri');
				return;
			}

			if (typeof state === 'string' && state.length <= 2048) {
				redirectUrl.searchParams.set('state', state);
			}

			res.setHeader('Location', redirectUrl.toString());
			res.status(302).end();
		} catch {
			res.status(400).send('Invalid post_logout_redirect_uri');
		}
	});

	return new Promise<MockOAuth2ServerHandle>((resolve, reject) => {
		const server = app.listen(config.port, config.host ?? 'localhost', () => {
			console.log(`Mock OAuth2 server running on ${config.baseUrl}`);
			console.log(`JWKS endpoint running on ${config.baseUrl}/.well-known/jwks.json`);

			const disposer = {
				stop: () => {
					return new Promise<void>((resolveStop, rejectStop) => {
						server.close((err) => {
							if (err) rejectStop(err);
							else resolveStop();
						});
					});
				},
			};

			resolve({ server, disposer });
		});

		server.on('error', reject);
	});
}

export function createMockOAuth2Manager(): {
	register(name: string, config: MockOAuth2ServerConfig): Promise<MockOAuth2ServerHandle & { baseUrl: string; name: string }>;
	stopAll(): Promise<void>;
} {
	const handles = new Map<string, MockOAuth2ServerHandle>();

	return {
		async register(name: string, config: MockOAuth2ServerConfig) {
			if (handles.has(name)) throw new Error(`Registration with name ${name} already exists`);
			const handle = await startMockOAuth2Server(config);
			handles.set(name, handle);
			return Object.assign({}, handle, { baseUrl: config.baseUrl, name });
		},
		async stopAll() {
			const stops: Promise<void>[] = [];
			for (const [, h] of handles.entries()) {
				if (h?.disposer && typeof h.disposer.stop === 'function') {
					stops.push(h.disposer.stop());
				}
			}
			await Promise.all(stops);
			handles.clear();
		},
	};
}
