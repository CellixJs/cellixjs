import { describe, expect, it } from 'vitest';
import { startMockOAuth2Server } from '../src/index';

async function decodeJwtPayload(jwt: string) {
	const parts = jwt.split('.');
	if (parts.length !== 3) return null;
	const payload = parts[1];
	const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
	const buf = Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
	return JSON.parse(buf.toString('utf8'));
}

describe('integration: multiple providers', async () => {
	it('serves provider-prefixed discovery and tokens', async () => {
		const port = 0; // ephemeral
		const allowedRedirect = 'https://app.example/cb';
		const cfg = {
			port,
			host: '127.0.0.1',
			allowedRedirectUris: new Set([allowedRedirect]),
			allowedRedirectUri: allowedRedirect,
			redirectUriToAudience: new Map([[allowedRedirect, 'mock-client']]),
			getUserProfile: () => ({ email: 'x@y.com', given_name: 'X', family_name: 'Y' }),
			providers: {
				owner: { issuer: 'https://owner.mock' },
				partner: { issuer: 'https://partner.mock' },
			},
		};

		const { server, disposer } = await startMockOAuth2Server(cfg as any);
		try {
			// determine listening port
			const addr: any = server.address();
			const listenPort = addr && addr.port ? addr.port : 4000;
			const base = `http://127.0.0.1:${listenPort}`;

			// owner discovery
			const discResp = await fetch(`${base}/owner/.well-known/openid-configuration`);
			expect(discResp.status).toBe(200);
			const disc = await discResp.json();
			expect(disc.issuer).toBe('https://owner.mock');

			// partner discovery
			const discResp2 = await fetch(`${base}/partner/.well-known/openid-configuration`);
			expect(discResp2.status).toBe(200);
			const disc2 = await discResp2.json();
			expect(disc2.issuer).toBe('https://partner.mock');

			// request token for owner
			const code = `mock-auth-code-${Buffer.from(allowedRedirect).toString('base64')}`;
			const tokenResp = await fetch(`${base}/owner/token`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ grant_type: 'authorization_code', code }),
			});
			expect(tokenResp.status).toBe(200);
			const tokenJson = await tokenResp.json();
			expect(tokenJson.id_token).toBeDefined();
			const payload = await decodeJwtPayload(tokenJson.id_token as string);
			expect(payload.iss).toBe('https://owner.mock');
		} finally {
			await disposer.stop();
		}
	}, 20000);
});
