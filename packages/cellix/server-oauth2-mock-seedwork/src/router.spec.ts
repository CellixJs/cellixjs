import type { Server } from 'node:http';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildOidcRouter } from './router.ts';
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
		if (this.users.some((u) => u.username === user.username || u.sub === user.sub)) {
			throw new Error('duplicate');
		}
		this.users.push(user);
		return Promise.resolve();
	}
}

function baseUrlFor(port: number) {
	return `http://127.0.0.1:${port}`;
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

	it('POST /signup persists user and rejects duplicate username', async () => {
		const signupUrl = `http://127.0.0.1:${port}/signup`;
		const body = new URLSearchParams({ username: 'alice', password: 'secret', email: 'alice@example.com', given_name: 'Alice', family_name: 'Smith', redirect_uri: redirect });
		const res = await fetch(signupUrl, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(res.status).toBe(302);
		// user persisted
		expect(store.users.length).toBe(1);
		const u = store.users[0] as MockOAuth2User;
		expect(u.username).toBe('alice');

		// duplicate signup should fail (500)
		const res2 = await fetch(signupUrl, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect([500, 400]).toContain(res2.status);
	});

	it('POST /login authenticates user and rejects wrong password', async () => {
		// ensure user exists
		store.users.push({ username: 'bob', sub: 'sub-bob', password: 'p@ss', claims: { email: 'bob@example.com', given_name: 'Bob' } });
		const loginUrl = `http://127.0.0.1:${port}/login`;
		const good = new URLSearchParams({ username: 'bob', password: 'p@ss', redirect_uri: redirect });
		const r1 = await fetch(loginUrl, { method: 'POST', body: good.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(r1.status).toBe(302);

		const bad = new URLSearchParams({ username: 'bob', password: 'wrong', redirect_uri: redirect });
		const r2 = await fetch(loginUrl, { method: 'POST', body: bad.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
		expect(r2.status).toBe(401);
	});

	it('/token and /userinfo include full user claims and never include password', async () => {
		// Signup a new user to obtain an auth code mapped in authCodeStore
		const signupUrl = `http://127.0.0.1:${port}/signup`;
		const body = new URLSearchParams({ username: 'carol', password: 'secret', email: 'carol@example.com', given_name: 'Carol', family_name: 'Jones', redirect_uri: redirect });
		const res = await fetch(signupUrl, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
		expect(res.status).toBe(302);
		const loc = res.headers.get('location') as string;
		const u = new URL(loc);
		const code = u.searchParams.get('code') as string;

		// exchange code for token
		const tokenRes = await fetch(`http://127.0.0.1:${port}/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'authorization_code', code }) });
		expect(tokenRes.status).toBe(200);
		interface TokenResponse { id_token?: string; access_token?: string; [k: string]: unknown }
		interface ClaimsPayload { email?: string; given_name?: string; family_name?: string; sub?: string; password?: string; [k: string]: unknown }
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
