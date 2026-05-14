import crypto from 'node:crypto';
import type { Request, RequestHandler, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { buildLoginHtml, buildSignupHtml } from './html-builders.ts';
import type { MockOAuth2PortalConfig, MockOAuth2User } from './types.ts';
import { AUTH_CODE_PREFIX } from './utils.ts';

interface AuthCodeStoreEntry {
	sub?: string;
	redirectUri: string;
	nonce?: string;
}

interface LoginSessionStoreEntry {
	redirectUri: string;
	state: string;
	nonce?: string;
}

interface TtlStore<T> {
	get(key: string): T | undefined;
	set(key: string, value: T): void;
	delete(key: string): void;
	has(key: string): boolean;
}

interface LoginHandlerDeps {
	config: MockOAuth2PortalConfig;
	issuerBaseUrl: string;
	primaryRedirectUri: string;
	normalizedAllowedRedirectUris: Set<string>;
	loginSessionStore: TtlStore<LoginSessionStoreEntry>;
	authCodeStore: TtlStore<AuthCodeStoreEntry>;
	normalizeUrl: (url: string) => string;
	buildRedirectWithCode: (redirect: string, code: string, state?: string) => string;
	logger: { debug: (msg: string, meta?: Record<string, unknown>) => void };
}

function isFormRequest(req: Request): boolean {
	const contentType = req.get('content-type');
	return typeof contentType === 'string' && contentType.includes('application/x-www-form-urlencoded');
}

export function createLoginHandlers(deps: LoginHandlerDeps): {
	registerRoutes(router: Router): void;
} {
	const { config, issuerBaseUrl, primaryRedirectUri, normalizedAllowedRedirectUris, loginSessionStore, authCodeStore, normalizeUrl, buildRedirectWithCode, logger } = deps;
	const formRateLimiter = rateLimit({
		windowMs: 60 * 1000,
		max: 30,
		standardHeaders: true,
		legacyHeaders: false,
	}) as unknown as RequestHandler;
	const credentialRateLimiter = rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 10,
		standardHeaders: true,
		legacyHeaders: false,
		message: { error: 'Too many attempts, please try again later.' },
	}) as unknown as RequestHandler;

	return {
		registerRoutes(router: Router) {
			router.get('/login', formRateLimiter, (req, res) => {
				if (!config.userStore) {
					res.status(404).send('Login not available');
					return;
				}
				const { state, redirect_uri, nonce } = req.query as { state?: string; redirect_uri?: string; nonce?: string };
				// Validate and bound query parameters to prevent memory bloat
				const rawState = typeof state === 'string' ? state : '';
				if (rawState.length > 2048) {
					res.status(400).json({ error: 'state parameter too large' });
					return;
				}
				const redirect = typeof redirect_uri === 'string' ? redirect_uri : primaryRedirectUri;
				// Validate the full redirect_uri (including query params) against the normalized allowlist
				// so GET and POST use the same validation semantics. Store the normalized value for consistency.
				let normalizedRedirect: string;
				try {
					normalizedRedirect = normalizeUrl(redirect);
					if (!normalizedAllowedRedirectUris.has(normalizedRedirect)) {
						res.status(400).json({ error: 'Invalid redirect_uri' });
						return;
					}
				} catch {
					res.status(400).json({ error: 'Invalid redirect_uri' });
					return;
				}
				const safeState = rawState;
				const safeNonce = typeof nonce === 'string' ? nonce : undefined;
				const sessionNonce = crypto.randomUUID();
				loginSessionStore.set(sessionNonce, {
					redirectUri: normalizedRedirect,
					state: safeState,
					...(safeNonce === undefined ? {} : { nonce: safeNonce }),
				});
				logger.debug('[server-oauth2-mock] GET /login', { sessionNonce, loginSessionFound: loginSessionStore.has(sessionNonce) });
				res.setHeader('Content-Type', 'text/html; charset=utf-8');
				res.send(buildLoginHtml({ issuerBaseUrl, nonce: sessionNonce }));
			});

			router.post('/login', credentialRateLimiter, async (req, res) => {
				if (!config.userStore) {
					res.status(404).send('Login not available');
					return;
				}
				const { username, password } = req.body;
				if (typeof username !== 'string' || typeof password !== 'string') {
					res.status(400).json({ error: 'username and password are required' });
					return;
				}
				const nonceFromBody = typeof req.body.nonce === 'string' ? req.body.nonce : undefined;
				const { nonce: rawQueryNonce } = req.query as Record<string, unknown>;
				const nonceFromQuery = typeof rawQueryNonce === 'string' ? rawQueryNonce : undefined;
				let loginNonceUsed: string | undefined;
				let loginSession: LoginSessionStoreEntry | undefined;
				if (nonceFromBody) {
					loginNonceUsed = nonceFromBody;
					loginSession = loginSessionStore.get(nonceFromBody);
				}
				if (!loginSession && nonceFromQuery) {
					loginNonceUsed = nonceFromQuery;
					loginSession = loginSessionStore.get(nonceFromQuery);
				}
				let refererLookup: string | undefined;
				if (!loginSession) {
					const referer = req.get('referer') ?? req.get('referrer');
					if (typeof referer === 'string') {
						try {
							const refUrl = new URL(referer);
							const alt = refUrl.searchParams.get('nonce');
							if (alt) {
								refererLookup = alt;
								const altSession = loginSessionStore.get(alt);
								if (altSession) {
									loginNonceUsed = alt;
									loginSession = altSession;
								}
							}
						} catch {
							// ignore
						}
					}
				}

				logger.debug('[server-oauth2-mock] POST /login', { nonceFromBody, nonceFromQuery, loginSessionFound: Boolean(loginSession), username });

				if (!loginSession) {
					console.warn('[server-oauth2-mock] Missing login session for nonce (body:%s, query:%s, refererLookup:%s) — rejecting request', nonceFromBody, nonceFromQuery, refererLookup ?? req.get('referer'));
					const link = `${issuerBaseUrl}/authorize?redirect_uri=${encodeURIComponent(primaryRedirectUri)}`;
					res
						.status(400)
						.setHeader('Content-Type', 'text/html; charset=utf-8')
						.send(`<!doctype html><html><body><h1>Session expired</h1><p>Your login session has expired or is invalid. <a href="${link}">Start a new login</a></p></body></html>`);
					return;
				}

				const redirect = loginSession.redirectUri ?? primaryRedirectUri;
				const state = loginSession.state ?? undefined;
				try {
					const store = config.userStore;
					const user = await store.findByUsername(username);
					if (!user || typeof user.password !== 'string' || user.password !== password) {
						if (isFormRequest(req)) {
							res
								.status(200)
								.setHeader('Content-Type', 'text/html; charset=utf-8')
								.send(buildLoginHtml({ issuerBaseUrl, nonce: loginNonceUsed ?? '', username, error: 'Invalid username or password. Please try again.' }));
							return;
						}
						res.status(401).send('Invalid credentials');
						return;
					}
					try {
						const normalized = normalizeUrl(redirect);
						if (!normalizedAllowedRedirectUris.has(normalized)) {
							res.status(400).send('Invalid redirect_uri');
							return;
						}
						const code = `${AUTH_CODE_PREFIX}${crypto.randomUUID()}`;
						authCodeStore.set(code, {
							sub: user.sub,
							redirectUri: normalized,
							...(loginSession.nonce === undefined ? {} : { nonce: loginSession.nonce }),
						});
						if (loginNonceUsed) {
							loginSessionStore.delete(loginNonceUsed);
						}
						logger.debug('[server-oauth2-mock] POST /login success', { authCode: `${code.substring(0, 8)}...`, redirectUri: redirect, state });
						const location = buildRedirectWithCode(redirect, code, state);
						res.setHeader('Location', location);
						res.status(302).end();
					} catch {
						res.status(400).send('Invalid redirect_uri format');
					}
				} catch {
					res.status(500).send('Login failed');
				}
			});

			router.get('/signup', formRateLimiter, (req, res) => {
				if (!config.userStore) {
					res.status(404).send('Signup not available');
					return;
				}
				const { state, redirect_uri, nonce: queryNonce } = req.query as { state?: string; redirect_uri?: string; nonce?: string };
				const existingSession = typeof queryNonce === 'string' ? loginSessionStore.get(queryNonce) : undefined;
				if (existingSession && typeof queryNonce === 'string') {
					loginSessionStore.delete(queryNonce);
				}
				// Validate and bound query parameters to prevent memory bloat
				const rawState = existingSession?.state ?? (typeof state === 'string' ? state : '');
				if (rawState.length > 2048) {
					res.status(400).json({ error: 'state parameter too large' });
					return;
				}
				const rawRedirect = existingSession?.redirectUri ?? (typeof redirect_uri === 'string' ? redirect_uri : primaryRedirectUri);
				// Validate the full redirect_uri (including query params) against the normalized allowlist
				// so GET and POST use the same validation semantics. Store the normalized value for consistency.
				let normalizedRedirect: string;
				try {
					normalizedRedirect = normalizeUrl(rawRedirect);
					if (!normalizedAllowedRedirectUris.has(normalizedRedirect)) {
						res.status(400).json({ error: 'Invalid redirect_uri' });
						return;
					}
				} catch {
					res.status(400).json({ error: 'Invalid redirect_uri' });
					return;
				}
				const safeState = rawState;
				const safeNonce = existingSession
					? existingSession.nonce
					: typeof queryNonce === 'string'
						? queryNonce
						: undefined;
				const nonce = crypto.randomUUID();
				loginSessionStore.set(nonce, {
					redirectUri: normalizedRedirect,
					state: safeState,
					...(safeNonce === undefined ? {} : { nonce: safeNonce }),
				});
				res.setHeader('Content-Type', 'text/html; charset=utf-8');
				res.send(buildSignupHtml({ issuerBaseUrl, nonce }));
			});

			router.post('/signup', credentialRateLimiter, async (req, res) => {
				if (!config.userStore) {
					res.status(404).send('Signup not available');
					return;
				}
				const { username, password } = req.body;
				if (typeof username !== 'string' || typeof password !== 'string') {
					res.status(400).json({ error: 'username and password are required' });
					return;
				}
				const email = typeof req.body.email === 'string' ? req.body.email : undefined;
				const given_name = typeof req.body.given_name === 'string' ? req.body.given_name : undefined;
				const family_name = typeof req.body.family_name === 'string' ? req.body.family_name : undefined;
				const signupNonce = typeof req.body.nonce === 'string' ? req.body.nonce : '';
				const signupSession = loginSessionStore.get(signupNonce);
				const redirect = signupSession?.redirectUri ?? primaryRedirectUri;
				const state = signupSession?.state ?? undefined;
				try {
					const claimsObj: { email?: unknown; given_name?: unknown; family_name?: unknown; [key: string]: unknown } = {};
					if (email) claimsObj.email = email;
					if (given_name) claimsObj.given_name = given_name;
					if (family_name) claimsObj.family_name = family_name;
					const newUser: MockOAuth2User = { username, sub: crypto.randomUUID(), password, claims: claimsObj };
					const store = config.userStore;
					await store.addUser(newUser);
					await store.persist?.();
					try {
						const normalized = normalizeUrl(redirect);
						if (!normalizedAllowedRedirectUris.has(normalized)) {
							res.status(400).send('Invalid redirect_uri');
							return;
						}
						const code = `${AUTH_CODE_PREFIX}${crypto.randomUUID()}`;
						authCodeStore.set(code, {
							sub: newUser.sub,
							redirectUri: normalized,
							...(signupSession?.nonce === undefined ? {} : { nonce: signupSession.nonce }),
						});
						if (signupNonce) {
							loginSessionStore.delete(signupNonce);
						}
						const location = buildRedirectWithCode(redirect, code, state);
						res.setHeader('Location', location);
						res.status(302).end();
					} catch {
						res.status(400).send('Invalid redirect_uri format');
					}
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error);
					if (message.toLowerCase().includes('already exists')) {
						if (isFormRequest(req)) {
							res
								.status(200)
								.setHeader('Content-Type', 'text/html; charset=utf-8')
								.send(buildSignupHtml({ issuerBaseUrl, nonce: signupNonce, username, email, given_name, family_name, error: 'A user with that username already exists. Please choose a different username.' }));
							return;
						}
						res.status(409).json({ error: 'user_exists', error_description: message });
						return;
					}
					res.status(500).send('Signup failed');
				}
			});
		},
	};
}
