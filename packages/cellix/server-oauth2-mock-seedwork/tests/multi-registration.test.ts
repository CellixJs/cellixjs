import { createMockOAuth2Manager, type MockOAuth2PortalConfig, type MockOAuth2ServerConfig, startMockOAuth2Server } from '@cellix/server-oauth2-mock-seedwork';
import { describe, expect, it } from 'vitest';

// Helper to create a basic portal config with specified client port
function makeConfig(port: number): MockOAuth2PortalConfig & { clientPort: number } {
	const clientBase = `http://localhost:${port}`;
	return {
		clientPort: port,
		allowedRedirectUris: new Set([`${clientBase}/callback`]),
		allowedRedirectUri: `${clientBase}/callback`,
		redirectUriToAudience: new Map([[`${clientBase}/callback`, `mock-client-${port}`]]),
		getUserProfile: () => ({
			email: `user${port}@example.com`,
			given_name: 'Test',
			family_name: 'User',
		}),
	};
}

async function fetchJson(url: string) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed fetch ${url}: ${res.status}`);
	return res.json();
}

describe('multi-registration contract', () => {
	it('registers two named OIDC configs and exposes distinct metadata/jwks', async () => {
		const port = 38200;
		const manager = createMockOAuth2Manager({ port, host: 'localhost', baseUrl: `http://localhost:${port}` });
		const cfg1 = makeConfig(38210);
		const cfg2 = makeConfig(38211);

		const handle1 = await manager.register('portal', cfg1);
		const handle2 = await manager.register('admin', cfg2);

		try {
			const meta1 = await fetchJson(`${handle1.baseUrl}/.well-known/openid-configuration`);
			const meta2 = await fetchJson(`${handle2.baseUrl}/.well-known/openid-configuration`);

			expect(meta1.issuer).toBe(handle1.baseUrl);
			expect(meta2.issuer).toBe(handle2.baseUrl);

			const jwks1 = await fetchJson(`${handle1.baseUrl}/.well-known/jwks.json`);
			const jwks2 = await fetchJson(`${handle2.baseUrl}/.well-known/jwks.json`);

			expect(Array.isArray(jwks1.keys)).toBe(true);
			expect(Array.isArray(jwks2.keys)).toBe(true);
		} finally {
			await manager.stopAll();
		}
	});

	it('per-config auth flow is isolated (authorize -> token)', async () => {
		const port = 38202;
		const manager = createMockOAuth2Manager({ port, host: 'localhost', baseUrl: `http://localhost:${port}` });
		const cfg1 = makeConfig(38212);
		const cfg2 = makeConfig(38213);

		const h1 = await manager.register('one', cfg1);
		const h2 = await manager.register('two', cfg2);

		try {
			// call authorize for h1 with its redirect
			const authRes = await fetch(`${h1.baseUrl}/authorize?redirect_uri=${encodeURIComponent(cfg1.allowedRedirectUri)}`, { redirect: 'manual' });
			expect(authRes.status).toBe(302);
			const location = authRes.headers.get('location');
			expect(location).toBeTruthy();
			const url = new URL(location as string);
			const code = url.searchParams.get('code');
			expect(code).toBeTruthy();

			// exchange code at token endpoint for h1
			const tokenRes = await fetch(`${h1.baseUrl}/token`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ grant_type: 'authorization_code', code }),
			});
			const tokenJson = await tokenRes.json();
			expect(tokenJson).toHaveProperty('access_token');
			expect(tokenJson.profile.aud).toBe(`mock-client-${cfg1.clientPort}`);

			// ensure h2 tokens are independent by performing authorize/token on h2
			const authRes2 = await fetch(`${h2.baseUrl}/authorize?redirect_uri=${encodeURIComponent(cfg2.allowedRedirectUri)}`, { redirect: 'manual' });
			expect(authRes2.status).toBe(302);
			const location2 = authRes2.headers.get('location');
			const url2 = new URL(location2 as string);
			const code2 = url2.searchParams.get('code');

			const tokenRes2 = await fetch(`${h2.baseUrl}/token`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ grant_type: 'authorization_code', code: code2 }),
			});
			const tokenJson2 = await tokenRes2.json();
			expect(tokenJson2.profile.aud).toBe(`mock-client-${cfg2.clientPort}`);
		} finally {
			await manager.stopAll();
		}
	});

	it('single-config backward compatibility with startMockOAuth2Server', async () => {
		const cfg: MockOAuth2ServerConfig = {
			port: 38204,
			baseUrl: 'http://localhost:38204',
			allowedRedirectUris: new Set(['http://localhost:38204/callback']),
			allowedRedirectUri: 'http://localhost:38204/callback',
			redirectUriToAudience: new Map([['http://localhost:38204/callback', 'mock-client-38204']]),
			host: 'localhost',
			getUserProfile: () => ({ email: 'x@example.com', given_name: 'T', family_name: 'U' }),
		};
		const handle = await startMockOAuth2Server(cfg);
		try {
			const meta = await fetchJson(`${cfg.baseUrl}/.well-known/openid-configuration`);
			expect(meta.issuer).toBe(cfg.baseUrl);
		} finally {
			await handle.disposer.stop();
		}
	});
});
