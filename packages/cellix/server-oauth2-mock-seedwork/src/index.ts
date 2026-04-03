import crypto, { type KeyObject, type webcrypto } from 'node:crypto';
import express from 'express';
import { exportJWK, exportPKCS8, generateKeyPair, type JWK, SignJWT } from 'jose';

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

export async function startMockOAuth2Server(config: MockOAuth2ServerConfig) {
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

		const normalizeOrigin = (u: string) => {
			try {
				const parsed = new URL(u);
				return `${parsed.protocol}//${parsed.host}`;
			} catch {
				return u;
			}
		};

		let allowOrigin = false;
		if (typeof originHeader === 'string') {
			try {
				const originUrl = new URL(originHeader);
				const { hostname } = originUrl;

				// Allow explicit localhost addresses and any subdomain under `.localhost`
				if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname.endsWith('.localhost')) {
					allowOrigin = true;
				} else {
					// Allow origins that exactly match configured redirect URIs (origin portion only)
					const allowedOrigins = new Set<string>([...config.allowedRedirectUris].map(normalizeOrigin));
					allowedOrigins.add(normalizeOrigin(config.allowedRedirectUri));
					if (allowedOrigins.has(normalizeOrigin(originHeader))) {
						allowOrigin = true;
					}
				}
			} catch {
				// ignore parse errors and deny
			}
		}

		if (allowOrigin && typeof originHeader === 'string') {
			res.setHeader('Access-Control-Allow-Origin', originHeader);
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

		if (grant_type === 'refresh_token') {
			res.status(400).json({ error: 'invalid_grant' });
			return;
		}

		if (typeof code !== 'string') {
			res.status(400).json({
				error: 'invalid_request',
				error_description: 'code must be a string',
			});
			return;
		}

		let aud = config.redirectUriToAudience.get(config.allowedRedirectUri) ?? 'mock-client';

		if (code.startsWith('mock-auth-code-')) {
			try {
				const base64Part = code.replace('mock-auth-code-', '');
				const decodedRedirectUri = Buffer.from(base64Part, 'base64').toString('utf-8');
				if (config.allowedRedirectUris.has(decodedRedirectUri)) {
					aud = config.redirectUriToAudience.get(decodedRedirectUri) ?? aud;
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
		const requestedRedirectUri = redirect_uri ?? config.allowedRedirectUri;
		const normalizedRequestedRedirectUri = normalizeUrl(requestedRedirectUri);
		const isAllowed = [...config.allowedRedirectUris].some((value) => normalizeUrl(value) === normalizedRequestedRedirectUri) || normalizeUrl(config.allowedRedirectUri) === normalizedRequestedRedirectUri;
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

	app.get('/userinfo', (req, res) => {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith('Bearer ')) {
			res.status(401).json({ error: 'unauthorized' });
			return;
		}

		try {
			const token = authHeader.substring(7);
			const parts = token.split('.');
			if (parts.length !== 3 || !parts[1]) {
				res.status(401).json({ error: 'invalid_token' });
				return;
			}

			const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
			const username = payload.email ? String(payload.email).split('@')[0] : '';

			res.json({
				sub: payload.sub,
				email: payload.email,
				given_name: payload.given_name,
				family_name: payload.family_name,
				name: `${payload.given_name} ${payload.family_name}`,
				username,
			});
		} catch {
			res.status(401).json({ error: 'invalid_token' });
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
			if (typeof state === 'string' && state.length <= 2048) {
				redirectUrl.searchParams.set('state', state);
			}
			res.setHeader('Location', redirectUrl.toString());
			res.status(302).end();
		} catch {
			res.status(400).send('Invalid post_logout_redirect_uri');
		}
	});

	app.listen(config.port, config.host ?? 'localhost', () => {
		console.log(`Mock OAuth2 server running on ${config.baseUrl}`);
		console.log(`JWKS endpoint running on ${config.baseUrl}/.well-known/jwks.json`);
	});
}
