import crypto, { type KeyObject, type webcrypto } from 'node:crypto';
import type { Server } from 'node:http';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { exportJWK, exportPKCS8, generateKeyPair, type JWK, errors as joseErrors, jwtVerify, SignJWT } from 'jose';

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

export interface MockOAuth2UserProfile {
	sub?: string;
	email?: string;
	given_name?: string;
	family_name?: string;
	tid?: string;
	[claim: string]: unknown;
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

	// Include any extra custom claims from the profile, but ensure required OIDC fields always win
	const { sub, aud, email, given_name, family_name, tid, ...extraClaims } = profile;
	// Manually sign the id_token as a JWT with all claims using jose
	// Undefined values are intentionally omitted by JSON.stringify
	const idTokenPayload = {
		...extraClaims,
		iss: baseUrl,
		sub,
		aud,
		email,
		given_name,
		family_name,
		tid,
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
	// Undefined values are intentionally omitted by JSON.stringify
	const accessTokenPayload = {
		...extraClaims,
		iss: baseUrl,
		sub,
		aud,
		email,
		given_name,
		family_name,
		tid,
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
			...extraClaims,
			exp,
			ver: '1.0',
			iss: baseUrl,
			sub,
			aud,
			iat: now,
			email,
			given_name,
			family_name,
			tid,
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

// SAFE_NAME_RE: allow only ASCII letters, digits, underscore and hyphen.
// This prevents path-traversal and multi-segment names (no slashes, no dots).
// Kept at module scope to avoid reallocating the RegExp on each call and to
// make the allowed pattern easier to document and reuse.
const SAFE_NAME_RE = /^[a-zA-Z0-9_-]+$/;

export interface MockOAuth2ServerHandle {
	server: Server;
	disposer: {
		stop: () => Promise<void>;
	};
}

export async function buildOidcRouter(issuerBaseUrl: string, config: MockOAuth2PortalConfig): Promise<express.Router> {
	const router = express.Router();

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

	// Derive the set of allowed audiences from the configured redirect-uri->audience map.
	// Include a default mock client id so tokens issued with the fallback audience remain valid.
	const allowedAudiences = new Set(normalizedRedirectUriToAudience.values());
	allowedAudiences.add('mock-client');

	const normalizedAllowedOrigins = new Set<string>([...normalizedAllowedRedirectUris].map((u) => normalizeOrigin(u)));

	// Serve JWKS endpoint from Express
	router.get('/.well-known/jwks.json', (_req, res) => {
		res.json({ keys: [publicJwk] });
	});

	router.use(express.urlencoded({ extended: true }));
	router.use(express.json());

	// CORS middleware
	router.use((req, res, next) => {
		const originHeader = req.headers.origin;

		let allowOrigin = false;
		if (typeof originHeader === 'string') {
			try {
				const originUrl = new URL(originHeader);
				const { hostname } = originUrl;

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

		// Preserve extra claims from the user profile by spreading unknown keys into the TokenProfile
		const { sub: upSub, email: upEmail, given_name: upGiven, family_name: upFamily, tid: upTid, ...extra } = userProfile;
		const resolvedTid = typeof tid === 'string' ? tid : typeof upTid === 'string' ? upTid : 'test-tenant-id';
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
		const tokenResponse = await buildTokenResponse(profile, keyObject, publicJwk, issuerBaseUrl);
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
			if (typeof state === 'string' && state.length <= 2048) {
				redirectUrl.searchParams.set('state', state);
			}
			res.setHeader('Location', redirectUrl.toString());
			res.status(302).end();
		} catch {
			res.status(400).send('Invalid redirect_uri format');
		}
	});

	const userinfoRateLimiter = rateLimit({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 100, // limit each IP to 100 requests per windowMs
		message: 'Too many /userinfo requests, please try again later.',
	});

	router.get('/userinfo', userinfoRateLimiter as unknown as Parameters<typeof router.get>[1], async (req, res) => {
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
			const { payload } = await jwtVerify(token, publicKey, {
				issuer: issuerBaseUrl,
				audience: Array.from(allowedAudiences),
			});

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

	router.get('/logout', (req, res) => {
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

	return router;
}

export async function startMockOAuth2Server(config: MockOAuth2ServerConfig): Promise<MockOAuth2ServerHandle> {
	const app = express();
	app.disable('x-powered-by');

	const router = await buildOidcRouter(config.baseUrl, config);
	app.use('/', router);

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

export interface MockOAuth2PortalConfig {
	allowedRedirectUris: Set<string>;
	allowedRedirectUri: string;
	redirectUriToAudience: Map<string, string>;
	getUserProfile: () => MockOAuth2UserProfile;
}

export function createMockOAuth2Manager(serverConfig: { port: number; host?: string; baseUrl: string }) {
	let app: express.Express | null = null;
	let serverHandle: MockOAuth2ServerHandle | null = null;
	let startupPromise: Promise<MockOAuth2ServerHandle> | null = null;
	let stopping = false;
	const registeredNames = new Set<string>();

	// ensureStarted is concurrency-safe: callers share startupPromise so only one
	// listener is ever created and concurrent register() callers will wait for
	// the same promise to resolve.
	function ensureStarted(): Promise<MockOAuth2ServerHandle> {
		if (startupPromise) return startupPromise;
		if (app && serverHandle) return Promise.resolve(serverHandle);

		// Reset stopping flag when creating a fresh startup
		stopping = false;

		// Initialize Express app synchronously so callers can mount routers after
		// startup completes. The actual server handle is provided via startupPromise.
		if (!app) {
			app = express();
			app.disable('x-powered-by');
		}

		startupPromise = new Promise<MockOAuth2ServerHandle>((resolve, reject) => {
			const a = app;
			if (!a) {
				startupPromise = null;
				return reject(new Error('express app not initialized'));
			}
			const s = a.listen(serverConfig.port, serverConfig.host ?? 'localhost', () => {
				console.log(`Mock OAuth2 server running on ${serverConfig.baseUrl}`);
				console.log(`JWKS endpoint running on ${serverConfig.baseUrl}/.well-known/jwks.json`);

				const disposer = {
					stop: () => {
						return new Promise<void>((resolveStop, rejectStop) => {
							s.close((err) => {
								if (err) rejectStop(err);
								else resolveStop();
							});
						});
					},
				};

				const handle: MockOAuth2ServerHandle = { server: s, disposer };
				if (stopping) {
					// Shutdown was requested before we finished starting — close immediately
					handle.disposer.stop().catch(() => {
						/* ignore stop error */
					});
					startupPromise = null;
					return reject(new Error('[server-oauth2-mock] Server stopped before startup completed'));
				}

				serverHandle = handle;
				resolve(handle);
			});

			s.on('error', (err) => {
				// Reset all state on error so future attempts can retry cleanly
				app = null; // reset so manager can be retried
				serverHandle = null; // reset server handle alongside app for consistent cleanup
				registeredNames.clear(); // clear registered names so subsequent retries can reuse names
				stopping = false;
				const sp = startupPromise;
				startupPromise = null;
				if (sp) reject(err);
			});
		});

		return startupPromise;
	}

	return {
		async register(name: string, config: MockOAuth2PortalConfig) {
			// Validate portal name to prevent path-traversal or multi-segment names
			if (!SAFE_NAME_RE.test(name)) {
				throw new Error(`[server-oauth2-mock] Invalid portal name "${name}": must match /${SAFE_NAME_RE.source}/`);
			}
			if (registeredNames.has(name)) throw new Error(`Registration with name ${name} already exists`);

			// Await the shared startup promise so concurrent callers wait for the
			// server to be listening and serverHandle to be set.
			await ensureStarted();
			const issuerBase = `${serverConfig.baseUrl.replace(/\/$/, '')}/${name}`;
			const router = await buildOidcRouter(issuerBase, config);
			// app must be non-null after ensureStarted resolves
			if (!app) throw new Error('express app not initialized');
			app.use(`/${name}`, router);
			registeredNames.add(name);

			// serverHandle is guaranteed to be set after ensureStarted resolves
			if (!serverHandle) throw new Error('server not started');
			return { server: serverHandle.server, disposer: serverHandle.disposer, baseUrl: issuerBase, name };
		},
		async stopAll() {
			// Indicate shutdown so an in-progress startup can be cancelled
			stopping = true;
			// Cancel any pending startup promise
			startupPromise = null;
			if (serverHandle) {
				await serverHandle.disposer.stop();
				serverHandle = null;
			}
			app = null;
			registeredNames.clear();
		},
	};
}
