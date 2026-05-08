import crypto from 'node:crypto';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_CODE_PREFIX, AUTH_CODE_TTL_MS, buildOidcRouter } from './router.ts';
import type { MockOAuth2PortalConfig, MockOAuth2User, MockOAuth2UserStore } from './types.ts';

class InMemoryUserStore implements MockOAuth2UserStore {
	users: MockOAuth2User[] = [];
	listUsers(): Promise<MockOAuth2User[]> {
		return Promise.resolve(this.users);
	}
	findByUsername(username: string): Promise<MockOAuth2User | undefined> {
		return Promise.resolve(this.users.find((u) => u.username === username));
	}
	findBySub(sub: string): Promise<MockOAuth2User | undefined> {
		return Promise.resolve(this.users.find((u) => u.sub === sub));
	}
	addUser(user: MockOAuth2User): Promise<void> {
		if (this.users.some((u) => u.username === user.username)) {
			throw new Error(`Username already exists: ${user.username}`);
		}
		if (this.users.some((u) => u.sub === user.sub)) {
			throw new Error(`Sub already exists: ${user.sub}`);
		}
		this.users.push(user);
		return Promise.resolve();
	}
}

function baseUrlFor(port: number) {
	return `http://127.0.0.1:${port}`;
}

function createPassword(label: string) {
	return `${label}-${crypto.randomUUID()}`;
}

async function startServer(port: number, store: MockOAuth2UserStore) {
	const app = express();
	app.disable('x-powered-by');
	const srv = app.listen(port);
	await new Promise<void>((resolve) => srv.on('listening', () => resolve()));
	const boundPort = (srv.address() as AddressInfo).port as number;
	const redirect = `${baseUrlFor(boundPort)}/cb`;
	const config: MockOAuth2PortalConfig = {
		allowedRedirectUris: new Set([redirect]),
		allowedRedirectUri: redirect,
		redirectUriToAudience: new Map([[redirect, 'test-aud']]),
		getUserProfile: () => ({ email: 'portal@example.com' }),
		userStore: store,
	};
	const issuerBase = `${baseUrlFor(boundPort)}`;
	const router = await buildOidcRouter(issuerBase, config);
	app.use(router);
	return { server: srv, port: boundPort, redirect };
}

function decodeJwtPayload(token: string) {
	const parts = token.split('.');
	if (parts.length < 2) return null;
	const payload = parts[1];
	if (!payload) return null;
	const buf = Buffer.from(payload, 'base64url');
	return JSON.parse(buf.toString('utf8')) as Record<string, unknown>;
}

async function getFormNonce(port: number, path: '/login' | '/signup', query?: Record<string, string>) {
	const url = new URL(`http://127.0.0.1:${port}${path}`);
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			url.searchParams.set(key, value);
		}
	}
	const res = await fetch(url);
	expect(res.status).toBe(200);
	const html = await res.text();
	const match = /name="nonce" value="([^"]+)"/.exec(html);
	const nonce = match?.[1];
	expect(nonce).toBeTruthy();
	return { html, nonce: nonce as string };
}

describe('oauth2 mock router flows', () => {
	let server: Server;
	let port: number;
	let redirect: string;
	let store: InMemoryUserStore;

	beforeEach(async () => {
		store = new InMemoryUserStore();
		const s = await startServer(0, store);
		server = s.server;
		port = s.port;
		redirect = s.redirect;
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await new Promise<void>((resolve) => server.close(() => resolve()));
	});

	it('GET /login stores redirect data server-side and only renders a nonce', async () => {
		const maliciousRedirect = `${redirect}?next=<script>alert(1)</script>`;
		const maliciousState = '"><svg/onload=alert(1)>';
		const { html } = await getFormNonce(port, '/login', { redirect_uri: maliciousRedirect, state: maliciousState });
		expect(html).toContain('name="nonce"');
		expect(html).not.toContain('<script>alert(1)</script>');
		expect(html).not.toContain('svg/onload=alert(1)');
		expect(html).not.toContain('redirect_uri');
		expect(html).not.toContain('state');
	});

	it('POST /signup persists user and rejects duplicate username', async () => {
		const signupUrl = `http://127.0.0.1:${port}/signup`;
		const alicePassword = createPassword('alice-password');
		const { nonce } = await getFormNonce(port, '/signup', { redirect_uri: redirect, state: 'signup-state' });
		const body = new URLSearchParams({ username: 'alice', password: alicePassword, email: 'alice@example.com', given_name: 'Alice', family_name: 'Smith', nonce });
		const res = await fetch(signupUrl, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toContain('state=signup-state');
		// user persisted
		expect(store.users.length).toBe(1);
		const u = store.users[0] as MockOAuth2User;
		expect(u.username).toBe('alice');

		// duplicate signup should fail with a conflict for API clients, but render the signup form with an inline error for browser form posts
		const { nonce: duplicateNonce } = await getFormNonce(port, '/signup', { redirect_uri: redirect, state: 'signup-state' });
		const duplicateBody = new URLSearchParams({ username: 'alice', password: alicePassword, email: 'alice@example.com', given_name: 'Alice', family_name: 'Smith', nonce: duplicateNonce });
		const res2 = await fetch(signupUrl, { method: 'POST', body: duplicateBody.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(res2.status).toBe(200);
		const html = await res2.text();
		expect(html).toContain('A user with that username already exists');
		expect(html).toContain('name="nonce"');
	});

	it('GET /authorize forwards login query params when a userStore is configured', async () => {
		const authorizeUrl = new URL(`http://127.0.0.1:${port}/authorize`);
		authorizeUrl.searchParams.set('redirect_uri', redirect);
		authorizeUrl.searchParams.set('state', 'authorize-state');
		authorizeUrl.searchParams.set('nonce', 'oidc-nonce');
		authorizeUrl.searchParams.set('code_challenge', 'challenge-value');
		authorizeUrl.searchParams.set('code_challenge_method', 'S256');
		const res = await fetch(authorizeUrl, { redirect: 'manual' });
		expect(res.status).toBe(302);
		const location = res.headers.get('location');
		expect(location).toBeTruthy();
		const loginLocation = new URL(location as string);
		expect(`${loginLocation.origin}${loginLocation.pathname}`).toBe(`${baseUrlFor(port)}/login`);
		expect(loginLocation.searchParams.get('state')).toBe('authorize-state');
		expect(loginLocation.searchParams.get('redirect_uri')).toBe(redirect);
		expect(loginLocation.searchParams.get('nonce')).toBe('oidc-nonce');
		expect(loginLocation.searchParams.get('code_challenge')).toBe('challenge-value');
		expect(loginLocation.searchParams.get('code_challenge_method')).toBe('S256');
	});

	it('POST /login authenticates user and rejects wrong password', async () => {
		// ensure user exists
		const bobPassword = createPassword('bob-password');
		const wrongPassword = createPassword('bob-password-wrong');
		store.users.push({ username: 'bob', sub: 'sub-bob', password: bobPassword, claims: { email: 'bob@example.com', given_name: 'Bob' } });
		const loginUrl = `http://127.0.0.1:${port}/login`;
		const { nonce } = await getFormNonce(port, '/login', { redirect_uri: redirect, state: 'login-state' });
		const good = new URLSearchParams({ username: 'bob', password: bobPassword, nonce });
		const r1 = await fetch(loginUrl, { method: 'POST', body: good.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(r1.status).toBe(302);
		expect(r1.headers.get('location')).toContain('state=login-state');

		const { nonce: badNonce } = await getFormNonce(port, '/login', { redirect_uri: redirect, state: 'bad-login-state' });
		const bad = new URLSearchParams({ username: 'bob', password: wrongPassword, nonce: badNonce });
		const r2 = await fetch(loginUrl, { method: 'POST', body: bad.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
		// For form-posts we render a friendly HTML page so the user can retry; expect 200 and an error message
		expect(r2.status).toBe(200);
		const errHtml = await r2.text();
		expect(errHtml).toContain('Invalid username or password');
	});

	it('POST /login preserves the OIDC nonce into token claims', async () => {
		const davePassword = createPassword('dave-password');
		store.users.push({ username: 'dave', sub: 'sub-dave', password: davePassword, claims: { email: 'dave@example.com' } });
		const loginUrl = `http://127.0.0.1:${port}/login`;
		const { nonce } = await getFormNonce(port, '/login', { redirect_uri: redirect, state: 'login-state', nonce: 'login-oidc-nonce' });
		const body = new URLSearchParams({ username: 'dave', password: davePassword, nonce });
		const res = await fetch(loginUrl, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(res.status).toBe(302);
		const location = res.headers.get('location');
		expect(location).toBeTruthy();
		const code = new URL(location as string).searchParams.get('code');
		expect(code?.startsWith(AUTH_CODE_PREFIX)).toBe(true);

		const tokenRes = await fetch(`http://127.0.0.1:${port}/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ grant_type: 'authorization_code', code }),
		});
		expect(tokenRes.status).toBe(200);
		const tokenJson = (await tokenRes.json()) as { id_token?: string; profile?: { nonce?: string } };
		expect(tokenJson.profile?.nonce).toBe('login-oidc-nonce');
		const idPayload = decodeJwtPayload(tokenJson.id_token as string) as { nonce?: string };
		expect(idPayload.nonce).toBe('login-oidc-nonce');
	});

	it('POST /login drops expired login sessions after ten minutes', async () => {
		const danPassword = createPassword('dan-password');
		store.users.push({ username: 'dan', sub: 'sub-dan', password: danPassword, claims: { email: 'dan@example.com' } });
		const nowSpy = vi.spyOn(Date, 'now');
		nowSpy.mockReturnValue(0);
		const loginUrl = `http://127.0.0.1:${port}/login`;
		const { nonce } = await getFormNonce(port, '/login', { redirect_uri: redirect, state: 'expired-login-state' });
		nowSpy.mockReturnValue(AUTH_CODE_TTL_MS + 1);

		const body = new URLSearchParams({ username: 'dan', password: danPassword, nonce });
		const res = await fetch(loginUrl, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(res.status).toBe(400);
		const text = await res.text();
		expect(text).toContain('Session expired');
	});

	it('POST /token ignores expired auth code mappings after ten minutes', async () => {
		const erinPassword = createPassword('erin-password');
		store.users.push({ username: 'erin', sub: 'sub-erin', password: erinPassword, claims: { email: 'erin@example.com', given_name: 'Erin' } });
		const nowSpy = vi.spyOn(Date, 'now');
		nowSpy.mockReturnValue(0);
		const loginUrl = `http://127.0.0.1:${port}/login`;
		const { nonce } = await getFormNonce(port, '/login', { redirect_uri: redirect, state: 'expired-code-state' });
		const loginBody = new URLSearchParams({ username: 'erin', password: erinPassword, nonce });
		const loginRes = await fetch(loginUrl, { method: 'POST', body: loginBody.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(loginRes.status).toBe(302);
		const location = loginRes.headers.get('location') ?? '';
		const code = new URL(location).searchParams.get('code');
		expect(code?.startsWith(AUTH_CODE_PREFIX)).toBe(true);

		nowSpy.mockReturnValue(AUTH_CODE_TTL_MS + 1);
		const tokenRes = await fetch(`http://127.0.0.1:${port}/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ grant_type: 'authorization_code', code }),
		});
		expect(tokenRes.status).toBe(200);
		const tokenJson = (await tokenRes.json()) as { profile: { email?: string; sub: string } };
		expect(tokenJson.profile.email).toBe('portal@example.com');
		expect(tokenJson.profile.sub).not.toBe('sub-erin');
	});

	it('GET /signup preserves the OIDC nonce for direct signup flows', async () => {
		const signupUrl = `http://127.0.0.1:${port}/signup`;
		const frankPassword = createPassword('frank-password');
		const { nonce } = await getFormNonce(port, '/signup', {
			redirect_uri: redirect,
			state: 'signup-nonce-state',
			nonce: 'signup-oidc-nonce',
		});
		const body = new URLSearchParams({
			username: 'frank',
			password: frankPassword,
			email: 'frank@example.com',
			given_name: 'Frank',
			family_name: 'Taylor',
			nonce,
		});
		const res = await fetch(signupUrl, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(res.status).toBe(302);
		const location = res.headers.get('location');
		expect(location).toBeTruthy();
		const redirectUrl = new URL(location as string);
		expect(redirectUrl.searchParams.get('state')).toBe('signup-nonce-state');
		const code = redirectUrl.searchParams.get('code');
		expect(code?.startsWith(AUTH_CODE_PREFIX)).toBe(true);

		const tokenRes = await fetch(`http://127.0.0.1:${port}/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ grant_type: 'authorization_code', code }),
		});
		expect(tokenRes.status).toBe(200);
		const tokenJson = (await tokenRes.json()) as { id_token?: string; profile?: { nonce?: string } };
		expect(tokenJson.profile?.nonce).toBe('signup-oidc-nonce');
		const idPayload = decodeJwtPayload(tokenJson.id_token as string) as { nonce?: string };
		expect(idPayload.nonce).toBe('signup-oidc-nonce');
	});

	it('/token and /userinfo include full user claims and never include password', async () => {
		// Signup a new user to obtain an auth code mapped in authCodeStore
		const signupUrl = `http://127.0.0.1:${port}/signup`;
		const carolPassword = createPassword('carol-password');
		const { nonce } = await getFormNonce(port, '/signup', { redirect_uri: redirect, state: 'token-state' });
		const body = new URLSearchParams({ username: 'carol', password: carolPassword, email: 'carol@example.com', given_name: 'Carol', family_name: 'Jones', nonce });
		const res = await fetch(signupUrl, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(res.status).toBe(302);
		const loc = res.headers.get('location') as string;
		const u = new URL(loc);
		const code = u.searchParams.get('code') as string;
		expect(u.searchParams.get('state')).toBe('token-state');

		// exchange code for token
		const tokenRes = await fetch(`http://127.0.0.1:${port}/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'authorization_code', code }) });
		expect(tokenRes.status).toBe(200);
		interface TokenResponse {
			id_token?: string;
			access_token?: string;
			[k: string]: unknown;
		}
		interface ClaimsPayload {
			email?: string;
			given_name?: string;
			family_name?: string;
			sub?: string;
			password?: string;
			[k: string]: unknown;
		}
		const tokenJson = (await tokenRes.json()) as TokenResponse;
		expect(tokenJson).toHaveProperty('id_token');
		expect(tokenJson).toHaveProperty('access_token');

		const idPayload = decodeJwtPayload(tokenJson.id_token as string) as ClaimsPayload;
		const accessPayload = decodeJwtPayload(tokenJson.access_token as string) as ClaimsPayload;
		// Should contain claims from the stored user
		expect(idPayload.email).toBe('carol@example.com');
		expect(idPayload.given_name).toBe('Carol');
		expect(idPayload.family_name).toBe('Jones');
		// password must not be present
		expect(Object.hasOwn(idPayload, 'password')).toBe(false);
		expect(Object.hasOwn(accessPayload, 'password')).toBe(false);

		// userinfo
		const infoRes = await fetch(`http://127.0.0.1:${port}/userinfo`, { headers: { Authorization: `Bearer ${tokenJson.access_token}` } });
		expect(infoRes.status).toBe(200);
		const info = (await infoRes.json()) as ClaimsPayload;
		expect(info.email).toBe('carol@example.com');
		expect(info.given_name).toBe('Carol');
		expect(info.family_name).toBe('Jones');
		expect(Object.hasOwn(info, 'password')).toBe(false);
	});

	it('should allow a second user to log in after the first user logs out', async () => {
		// create two users
		const passA = createPassword('userA-password');
		const passB = createPassword('userB-password');
		store.users.push({ username: 'userA', sub: 'sub-A', password: passA, claims: { email: 'a@example.com' } });
		store.users.push({ username: 'userB', sub: 'sub-B', password: passB, claims: { email: 'b@example.com' } });

		// First user A login flow
		const authA = new URL(`http://127.0.0.1:${port}/authorize`);
		authA.searchParams.set('redirect_uri', redirect);
		authA.searchParams.set('state', 'state-A');
		const rA = await fetch(authA, { redirect: 'manual' });
		expect(rA.status).toBe(302);
		// fetch login page to obtain nonce
		const { nonce: nonceA } = await getFormNonce(port, '/login', { redirect_uri: redirect, state: 'state-A' });
		const loginResA = await fetch(`http://127.0.0.1:${port}/login`, {
			method: 'POST',
			body: new URLSearchParams({ username: 'userA', password: passA, nonce: nonceA }).toString(),
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			redirect: 'manual',
		});
		expect(loginResA.status).toBe(302);
		const locA = loginResA.headers.get('location') as string;
		const codeA = new URL(locA).searchParams.get('code');
		expect(codeA?.startsWith(AUTH_CODE_PREFIX)).toBe(true);
		expect(new URL(locA).searchParams.get('state')).toBe('state-A');

		// Exchange code for token for user A
		const tokenResA = await fetch(`http://127.0.0.1:${port}/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'authorization_code', code: codeA }) });
		expect(tokenResA.status).toBe(200);
		const tokenJsonA = (await tokenResA.json()) as { id_token?: string; profile?: { sub?: string } };
		expect(tokenJsonA.profile?.sub).toBe('sub-A');

		// Simulate logout (no server-side state required for this mock)
		const logoutRes = await fetch(`http://127.0.0.1:${port}/logout?post_logout_redirect_uri=${encodeURIComponent(redirect)}`, { redirect: 'manual' });
		expect(logoutRes.status).toBe(302);

		// Second user B login flow
		const authB = new URL(`http://127.0.0.1:${port}/authorize`);
		authB.searchParams.set('redirect_uri', redirect);
		authB.searchParams.set('state', 'state-B');
		const rB = await fetch(authB, { redirect: 'manual' });
		expect(rB.status).toBe(302);
		const { nonce: nonceB } = await getFormNonce(port, '/login', { redirect_uri: redirect, state: 'state-B' });
		const loginResB = await fetch(`http://127.0.0.1:${port}/login`, {
			method: 'POST',
			body: new URLSearchParams({ username: 'userB', password: passB, nonce: nonceB }).toString(),
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			redirect: 'manual',
		});
		expect(loginResB.status).toBe(302);
		const locB = loginResB.headers.get('location') as string;
		const codeB = new URL(locB).searchParams.get('code');
		expect(codeB?.startsWith(AUTH_CODE_PREFIX)).toBe(true);
		expect(new URL(locB).searchParams.get('state')).toBe('state-B');

		// Exchange code for token for user B
		const tokenResB = await fetch(`http://127.0.0.1:${port}/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'authorization_code', code: codeB }) });
		expect(tokenResB.status).toBe(200);
		const tokenJsonB = (await tokenResB.json()) as { id_token?: string; profile?: { sub?: string } };
		expect(tokenJsonB.profile?.sub).toBe('sub-B');
	});
	it('POST /login uses user.sub when present at top-level', async () => {
		const pass = createPassword('u-password');
		store.users.push({ username: 'topsub', sub: 'sub-top', password: pass, claims: { email: 'top@example.com' } });
		const loginUrl = `http://127.0.0.1:${port}/login`;
		const { nonce } = await getFormNonce(port, '/login', { redirect_uri: redirect, state: 'sub-top-state' });
		const body = new URLSearchParams({ username: 'topsub', password: pass, nonce });
		const res = await fetch(loginUrl, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(res.status).toBe(302);
		const location = res.headers.get('location') as string;
		const code = new URL(location).searchParams.get('code') as string;
		const tokenRes = await fetch(`http://127.0.0.1:${port}/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'authorization_code', code }) });
		expect(tokenRes.status).toBe(200);
		const tokenJson = await tokenRes.json() as { id_token?: string };
		const idPayload = decodeJwtPayload(tokenJson.id_token as string) as { sub?: string };
		expect(idPayload.sub).toBe('sub-top');
	});

	it('POST /login uses user.claims.sub when provided (merged into user.sub by file store)', async () => {
		const pass = createPassword('v-password');
		// In real file-backed user store claims.sub is promoted to top-level sub; tests simulate that behavior by setting user.sub accordingly
		store.users.push({ username: 'claimsub', sub: 'sub-claim', password: pass, claims: { email: 'claim@example.com', sub: 'sub-claim' } });
		const loginUrl = `http://127.0.0.1:${port}/login`;
		const { nonce } = await getFormNonce(port, '/login', { redirect_uri: redirect, state: 'sub-claim-state' });
		const body = new URLSearchParams({ username: 'claimsub', password: pass, nonce });
		const res = await fetch(loginUrl, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(res.status).toBe(302);
		const location = res.headers.get('location') as string;
		const code = new URL(location).searchParams.get('code') as string;
		const tokenRes = await fetch(`http://127.0.0.1:${port}/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'authorization_code', code }) });
		expect(tokenRes.status).toBe(200);
		const tokenJson = await tokenRes.json() as { id_token?: string };
		const idPayload = decodeJwtPayload(tokenJson.id_token as string) as { sub?: string };
		expect(idPayload.sub).toBe('sub-claim');
	});
});

describe('oauth2 mock router rate limiting', () => {
	async function stopServer(server: Server) {
		await new Promise<void>((resolve) => server.close(() => resolve()));
	}

	it('GET /login enforces the form rate limiter', async () => {
		const { server, port } = await startServer(0, new InMemoryUserStore());
		try {
			for (let index = 0; index < 30; index += 1) {
				const response = await fetch(`http://127.0.0.1:${port}/login`);
				expect(response.status).toBe(200);
			}

			const limitedResponse = await fetch(`http://127.0.0.1:${port}/login`);
			expect(limitedResponse.status).toBe(429);
			expect(limitedResponse.headers.get('ratelimit-remaining')).toBe('0');
		} finally {
			await stopServer(server);
		}
	});

	it('GET /signup enforces the form rate limiter', async () => {
		const { server, port } = await startServer(0, new InMemoryUserStore());
		try {
			for (let index = 0; index < 30; index += 1) {
				const response = await fetch(`http://127.0.0.1:${port}/signup`);
				expect(response.status).toBe(200);
			}

			const limitedResponse = await fetch(`http://127.0.0.1:${port}/signup`);
			expect(limitedResponse.status).toBe(429);
			expect(limitedResponse.headers.get('ratelimit-remaining')).toBe('0');
		} finally {
			await stopServer(server);
		}
	});

	it('POST /login enforces the credential rate limiter', async () => {
		const store = new InMemoryUserStore();
		store.users.push({ username: 'rate-limited-login', sub: 'sub-rate-limited-login', password: createPassword('correct-login-password'), claims: {} });
		const { server, port, redirect } = await startServer(0, store);
		try {
			const { nonce } = await getFormNonce(port, '/login', { redirect_uri: redirect, state: 'login-rate-limit-state' });
			for (let index = 0; index < 10; index += 1) {
				const response = await fetch(`http://127.0.0.1:${port}/login`, {
					method: 'POST',
					body: new URLSearchParams({ username: 'rate-limited-login', password: 'wrong-password', nonce }).toString(),
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				});
				expect(response.status).toBe(200);
			}

			const limitedResponse = await fetch(`http://127.0.0.1:${port}/login`, {
				method: 'POST',
				body: new URLSearchParams({ username: 'rate-limited-login', password: 'wrong-password', nonce }).toString(),
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			});
			expect(limitedResponse.status).toBe(429);
			expect(await limitedResponse.json()).toEqual({ error: 'Too many attempts, please try again later.' });
		} finally {
			await stopServer(server);
		}
	});

	it('POST /signup enforces the credential rate limiter', async () => {
		const store = new InMemoryUserStore();
		store.users.push({ username: 'existing-user', sub: 'sub-existing-user', password: createPassword('existing-user-password'), claims: {} });
		const { server, port, redirect } = await startServer(0, store);
		try {
			const { nonce } = await getFormNonce(port, '/signup', { redirect_uri: redirect, state: 'signup-rate-limit-state' });
			for (let index = 0; index < 10; index += 1) {
				const response = await fetch(`http://127.0.0.1:${port}/signup`, {
					method: 'POST',
					body: new URLSearchParams({ username: 'existing-user', password: 'duplicate-password', nonce }).toString(),
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				});
				expect(response.status).toBe(200);
			}

			const limitedResponse = await fetch(`http://127.0.0.1:${port}/signup`, {
				method: 'POST',
				body: new URLSearchParams({ username: 'existing-user', password: 'duplicate-password', nonce }).toString(),
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			});
			expect(limitedResponse.status).toBe(429);
			expect(await limitedResponse.json()).toEqual({ error: 'Too many attempts, please try again later.' });
		} finally {
			await stopServer(server);
		}
	});
});
