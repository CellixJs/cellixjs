import { describe, expect, it } from 'vitest';
import { createMockOAuth2Manager, type MockOAuth2PortalConfig, type MockOAuth2ServerConfig, startMockOAuth2Server } from '../src/index.ts';

interface TestTokenResponse {
	profile: { aud: string };
	access_token: string;
}

interface TestTokenWithClaimsResponse {
	id_token: string;
	access_token: string;
	profile: Record<string, unknown>;
}

interface TestClaimsPayload {
	roles: string[];
	department: string;
}

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

async function fetchJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed fetch ${url}: ${res.status}`);
	return res.json() as Promise<T>;
}

describe('multi-registration contract', () => {
	it('rejects duplicate portal names', async () => {
		const manager = createMockOAuth2Manager({
			port: 38199,
			host: 'localhost',
			baseUrl: 'http://localhost:38199',
		});
		const cfg = makeConfig(38299);
		try {
			await manager.register('duplicate', cfg);
			await expect(manager.register('duplicate', cfg)).rejects.toThrow();
		} finally {
			await manager.stopAll();
		}
	});
	it('registers two named OIDC configs and exposes distinct metadata/jwks', async () => {
		const port = 38200;
		const manager = createMockOAuth2Manager({ port, host: 'localhost', baseUrl: `http://localhost:${port}` });
		const cfg1 = makeConfig(38210);
		const cfg2 = makeConfig(38211);

		const handle1 = await manager.register('portal', cfg1);
		const handle2 = await manager.register('admin', cfg2);

		try {
			const meta1 = await fetchJson<{ issuer: string }>(`${handle1.baseUrl}/.well-known/openid-configuration`);
			const meta2 = await fetchJson<{ issuer: string }>(`${handle2.baseUrl}/.well-known/openid-configuration`);

			expect(meta1.issuer).toBe(handle1.baseUrl);
			expect(meta2.issuer).toBe(handle2.baseUrl);

			const jwks1 = await fetchJson<{ keys: unknown[] }>(`${handle1.baseUrl}/.well-known/jwks.json`);
			const jwks2 = await fetchJson<{ keys: unknown[] }>(`${handle2.baseUrl}/.well-known/jwks.json`);

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
			const tokenJson = (await tokenRes.json()) as TestTokenResponse;
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
			const tokenJson2 = (await tokenRes2.json()) as TestTokenResponse;
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
			const meta = await fetchJson<{ issuer: string }>(`${cfg.baseUrl}/.well-known/openid-configuration`);
			expect(meta.issuer).toBe(cfg.baseUrl);
		} finally {
			await handle.disposer.stop();
		}
	});

	it('throws when registering the same portal name twice', async () => {
		const manager = createMockOAuth2Manager({ port: 19010, host: '127.0.0.1', baseUrl: 'http://127.0.0.1:19010' });
		const config: MockOAuth2PortalConfig = {
			allowedRedirectUris: new Set(['http://localhost/cb']),
			allowedRedirectUri: 'http://localhost/cb',
			redirectUriToAudience: new Map([['http://localhost/cb', 'aud']]),
			getUserProfile: () => ({ sub: '00000000-0000-4000-8000-000000000001', email: 'a@b.com', given_name: 'A', family_name: 'B', tid: 't' }),
		};
		await manager.register('dupe', config);
		await expect(manager.register('dupe', config)).rejects.toThrow();
		await manager.stopAll();
	});

	it('includes array and custom claims verbatim in issued JWT', async () => {
		const manager = createMockOAuth2Manager({
			port: 19003,
			host: '127.0.0.1',
			baseUrl: 'http://127.0.0.1:19003',
		});

		await manager.register('claims-test', {
			allowedRedirectUris: new Set(['http://localhost/cb']),
			allowedRedirectUri: 'http://localhost/cb',
			redirectUriToAudience: new Map([['http://localhost/cb', 'test-aud']]),
			getUserProfile: () => ({
				sub: '00000000-0000-4000-8000-000000000099',
				email: 'test@example.com',
				given_name: 'Test',
				family_name: 'User',
				tid: 'test-tenant',
				roles: ['admin', 'editor'],
				department: 'engineering',
			}),
		});

		try {
			// Get auth code
			const authRes = await fetch('http://127.0.0.1:19003/claims-test/authorize?response_type=code&client_id=test-aud&redirect_uri=http%3A%2F%2Flocalhost%2Fcb&state=s&nonce=n', { redirect: 'manual' });
			const location = authRes.headers.get('location') ?? '';
			const code = new URL(location, 'http://base').searchParams.get('code') ?? '';

			// Exchange for token
			const tokenRes = await fetch('http://127.0.0.1:19003/claims-test/token', {
				method: 'POST',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					grant_type: 'authorization_code',
					code,
					redirect_uri: 'http://localhost/cb',
					client_id: 'test-aud',
				}),
			});
			const tokens = (await tokenRes.json()) as TestTokenWithClaimsResponse;

			// Decode JWT payload (no verification needed — just inspect claims)
			const payloadB64 = tokens.id_token.split('.')[1] as string;
			const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as TestClaimsPayload;

			expect(payload.roles).toEqual(['admin', 'editor']);
			expect(payload.department).toBe('engineering');

			// Also verify access_token contains the custom claims
			const accessPayloadB64 = tokens.access_token.split('.')[1] as string;
			const accessPayload = JSON.parse(Buffer.from(accessPayloadB64, 'base64url').toString('utf-8')) as TestClaimsPayload;
			expect(accessPayload.roles).toEqual(['admin', 'editor']);
			expect(accessPayload.department).toBe('engineering');

			// And the token response profile object should also include them
			const profileTyped = tokens.profile as unknown as TestClaimsPayload;
			expect(profileTyped.roles).toEqual(['admin', 'editor']);
			expect(profileTyped.department).toBe('engineering');
		} finally {
			await manager.stopAll();
		}
	});
});
