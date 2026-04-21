import { createMockOAuth2Manager, type MockOAuth2ServerConfig, startMockOAuth2Server } from '@cellix/server-oauth2-mock-seedwork';
import { describe, expect, it } from 'vitest';

// Helper to create a basic config with specified port and basePath
function makeConfig(port: number): MockOAuth2ServerConfig {
	const baseUrl = `http://localhost:${port}`;
	return {
		port,
		baseUrl,
		allowedRedirectUris: new Set([`${baseUrl}/callback`]),
		allowedRedirectUri: `${baseUrl}/callback`,
		redirectUriToAudience: new Map([[`${baseUrl}/callback`, `mock-client-${port}`]]),
		host: 'localhost',
		getUserProfile: () => ({
			email: `user${port}@example.com`,
			given_name: 'Test',
			family_name: 'User',
			// sub left undefined to ensure server generates persistent sub
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
		const manager = createMockOAuth2Manager();
		const cfg1 = makeConfig(38200);
		const cfg2 = makeConfig(38201);

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
		const manager = createMockOAuth2Manager();
		const cfg1 = makeConfig(38202);
		const cfg2 = makeConfig(38203);

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
			expect(tokenJson.profile.aud).toBe(`mock-client-${cfg1.port}`);

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
			expect(tokenJson2.profile.aud).toBe(`mock-client-${cfg2.port}`);
		} finally {
			await manager.stopAll();
		}
	});

	it('single-config backward compatibility with startMockOAuth2Server', async () => {
		const cfg = makeConfig(38204);
		const handle = await startMockOAuth2Server(cfg);
		try {
			const meta = await fetchJson(`${cfg.baseUrl}/.well-known/openid-configuration`);
			expect(meta.issuer).toBe(cfg.baseUrl);
		} finally {
			await handle.disposer.stop();
		}
	});
});
