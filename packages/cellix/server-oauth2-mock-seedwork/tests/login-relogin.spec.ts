import express from 'express';
import { describe, expect, it } from 'vitest';
import { AUTH_CODE_PREFIX, buildOidcRouter, type MockOAuth2PortalConfig, type MockOAuth2UserStore } from '../src/index.ts';

function makeConfig() {
	const clientBase = `http://127.0.0.1:6000`;
	const user = {
		username: 'testuser',
		sub: 'sub-1',
		password: 'password',
		claims: { email: 'test@ownercommunity.onmicrosoft.com', given_name: 'Test', family_name: 'User' },
	};

	const userStore: MockOAuth2UserStore = {
		listUsers: async () => [user],
		findByUsername: async (username: string) => (username === user.username ? user : undefined),
		findBySub: async (sub: string) => (sub === user.sub ? user : undefined),
		addUser: async () => undefined,
	};

	return {
		allowedRedirectUris: new Set([`${clientBase}/callback`]),
		allowedRedirectUri: `${clientBase}/callback`,
		redirectUriToAudience: new Map([[`${clientBase}/callback`, 'mock-client']]),
		getUserProfile: () => ({ email: 'test@ownercommunity.onmicrosoft.com', given_name: 'Test', family_name: 'User' }),
		userStore,
	};
}

describe('buildOidcRouter', () => {
	describe('login re-login fallback', () => {
		it('falls back to Referer nonce when body nonce is missing', async () => {
			const cfg = makeConfig();
			const app = express();
			app.disable('x-powered-by');
			const server = app.listen(0);

			try {
				await new Promise<void>((resolve) => server.on('listening', () => resolve()));
				const boundPort = (server.address() as unknown as { port: number }).port;
				const issuerBase = `http://127.0.0.1:${boundPort}`;
				const router = await buildOidcRouter(issuerBase, cfg as unknown as MockOAuth2PortalConfig);
				app.use(router);

				// Request login page to obtain server-side session nonce
				const loginUrl = `${issuerBase}/login?redirect_uri=${encodeURIComponent(cfg.allowedRedirectUri)}&state=s`;
				const loginRes = await fetch(loginUrl);
				expect(loginRes.status).toBe(200);
				const html = await loginRes.text();
				const match = html.match(/name="nonce" value="([^"]+)"/);
				expect(match).toBeTruthy();
				const serverNonce = match?.[1];
				expect(serverNonce).toBeTruthy();
				const nonce = serverNonce as string;

				// Post login without a body nonce but with Referer header pointing to the login page with the nonce
				const postRes = await fetch(`${issuerBase}/login`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: `${issuerBase}/login?nonce=${nonce}` },
					body: new URLSearchParams({ username: 'testuser', password: 'password', nonce: '' }).toString(),
					redirect: 'manual',
				});

				expect(postRes.status).toBe(302);
				const location = postRes.headers.get('location');
				expect(location).toBeTruthy();
				expect(location).toContain(cfg.allowedRedirectUri);
				expect(new URL(location as string).searchParams.get('code')?.startsWith(AUTH_CODE_PREFIX)).toBe(true);
			} finally {
				await new Promise<void>((resolve) => server.close(() => resolve()));
			}
		});
	});
});
