import crypto from 'node:crypto';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildOidcRouter } from './router.ts';
import type { MockOAuth2PortalConfig, MockOAuth2User, MockOAuth2UserStore } from './types.ts';

const TEN_MINUTES_MS = 10 * 60 * 1000;

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

	beforeAll(async () => {
		store = new InMemoryUserStore();
		const s = await startServer(0, store);
		server = s.server;
		port = s.port;
		redirect = s.redirect;
	});

	afterAll(async () => {
		await new Promise<void>((resolve) => server.close(() => resolve()));
	});

	afterEach(() => {
		vi.restoreAllMocks();
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

		// duplicate signup should fail with a conflict
		const { nonce: duplicateNonce } = await getFormNonce(port, '/signup', { redirect_uri: redirect, state: 'signup-state' });
		const duplicateBody = new URLSearchParams({ username: 'alice', password: alicePassword, email: 'alice@example.com', given_name: 'Alice', family_name: 'Smith', nonce: duplicateNonce });
		const res2 = await fetch(signupUrl, { method: 'POST', body: duplicateBody.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(res2.status).toBe(409);
		expect(await res2.json()).toEqual({
			error: 'user_exists',
			error_description: 'Username already exists: alice',
		});
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
		expect(r2.status).toBe(401);
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
		expect(code).toBeTruthy();

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
		nowSpy.mockReturnValue(TEN_MINUTES_MS + 1);

		const body = new URLSearchParams({ username: 'dan', password: danPassword, nonce });
		const res = await fetch(loginUrl, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(res.status).toBe(302);
		const location = res.headers.get('location') ?? '';
		expect(location).toContain('code=');
		expect(location).not.toContain('state=expired-login-state');
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
		expect(code).toBeTruthy();

		nowSpy.mockReturnValue(TEN_MINUTES_MS + 1);
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
		expect(code).toBeTruthy();

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
});
