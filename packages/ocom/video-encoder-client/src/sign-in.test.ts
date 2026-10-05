import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { buildOidcRouter, type MockOAuth2User, type MockOAuth2UserStore } from '@cellix/server-oauth2-mock-seedwork';
import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import { signInWithBrowser } from './sign-in.ts';

const staffUser: MockOAuth2User = {
	username: 'tech.admin@example.com',
	sub: 'staff-sub-1',
	password: 'password',
	claims: { given_name: 'Tia', family_name: 'Admin', roles: ['Staff.TechAdmin'] },
};

const userStore: MockOAuth2UserStore = {
	listUsers: () => Promise.resolve([staffUser]),
	findByUsername: (username) => Promise.resolve(username === staffUser.username ? staffUser : undefined),
	findBySub: (sub) => Promise.resolve(sub === staffUser.sub ? staffUser : undefined),
	addUser: () => Promise.reject(new Error('read-only')),
};

/** Starts the mock OIDC router in-process, the way the staff portal's mock issuer is configured. */
async function startMockIssuer(): Promise<{ server: Server; issuer: string }> {
	const app = express();
	app.disable('x-powered-by');
	const server = app.listen(0, '127.0.0.1');
	await new Promise<void>((resolve) => server.on('listening', () => resolve()));
	const issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
	const staffRedirect = 'https://staff.example.test/auth-redirect';
	app.use(
		await buildOidcRouter(issuer, {
			allowedRedirectUris: new Set([staffRedirect]),
			allowedRedirectUri: staffRedirect,
			redirectUriToAudience: new Map([[staffRedirect, 'mock-client']]),
			allowLoopbackRedirectUris: true,
			getUserProfile: () => ({}),
			userStore,
		}),
	);
	return { server, issuer };
}

/** Plays the user's browser: follows the authorize redirect, submits the login form, and returns to the loopback redirect. */
async function completeLoginInBrowser(authorizationUrl: string): Promise<void> {
	const authorize = await fetch(authorizationUrl, { redirect: 'manual' });
	const loginUrl = new URL(authorize.headers.get('location') ?? '', authorizationUrl);
	const loginPage = await (await fetch(loginUrl)).text();
	const nonce = /name="nonce" value="([^"]+)"/.exec(loginPage)?.[1] ?? '';
	const login = await fetch(new URL('/login', authorizationUrl), {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ username: staffUser.username, password: 'password', nonce }),
		redirect: 'manual',
	});
	const callback = await fetch(login.headers.get('location') ?? '');
	expect(await callback.text()).toContain('You are signed in');
}

describe('signInWithBrowser', () => {
	let server: Server | undefined;

	afterEach(async () => {
		const toClose = server;
		server = undefined;
		if (toClose) await new Promise<void>((resolve) => toClose.close(() => resolve()));
	});

	it('signs in with authorization code + PKCE through a loopback redirect', async () => {
		const mock = await startMockIssuer();
		server = mock.server;
		let openedUrl = '';

		const result = await signInWithBrowser({
			issuer: mock.issuer,
			clientId: 'mock-client',
			scope: 'openid',
			allowInsecureRequests: true,
			openUrl: async (url) => {
				openedUrl = url;
				await completeLoginInBrowser(url);
			},
		});

		const params = new URL(openedUrl).searchParams;
		expect(params.get('code_challenge_method')).toBe('S256');
		expect(params.get('redirect_uri')).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/callback\/[0-9a-f-]{36}$/);
		expect(result.accessToken.split('.')).toHaveLength(3);
		expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
		expect(result.claims).toMatchObject({ sub: 'staff-sub-1', aud: 'mock-client', roles: ['Staff.TechAdmin'] });
	});

	it('times out when the browser never completes the sign-in', async () => {
		const mock = await startMockIssuer();
		server = mock.server;

		await expect(signInWithBrowser({ issuer: mock.issuer, clientId: 'mock-client', scope: 'openid', allowInsecureRequests: true, timeoutMs: 50, openUrl: () => undefined })).rejects.toThrow('Timed out waiting for sign-in');
	});
});
