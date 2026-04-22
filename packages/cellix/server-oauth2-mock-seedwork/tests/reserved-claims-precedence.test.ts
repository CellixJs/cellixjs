import { describe, expect, it } from 'vitest';
import { createMockOAuth2Manager } from '../src/index.ts';

// Test that caller-provided reserved claims (iss, aud) do not override server values
describe('reserved claims precedence', () => {
	it('server-authoritative iss and aud win over user-provided extras', async () => {
		const manager = createMockOAuth2Manager({ port: 19010, host: '127.0.0.1', baseUrl: 'http://127.0.0.1:19010' });

		await manager.register('reserved-claims', {
			allowedRedirectUris: new Set(['http://localhost/cb'] ),
			allowedRedirectUri: 'http://localhost/cb',
			redirectUriToAudience: new Map([[ 'http://localhost/cb', 'server-aud' ]]),
			getUserProfile: () => ({
				// Malicious or mistaken extras that attempt to override reserved claims
				aud: 'evil-aud',
				iss: 'http://evil-issuer.local',
				email: 'hacker@example.com',
				given_name: 'Bad',
				family_name: 'Actor',
				roles: ['attacker'],
			}),
		});

		try {
			const authRes = await fetch(
				'http://127.0.0.1:19010/reserved-claims/authorize?response_type=code&client_id=server-aud&redirect_uri=http%3A%2F%2Flocalhost%2Fcb&state=s&nonce=n',
				{ redirect: 'manual' }
			);
			const location = authRes.headers.get('location') ?? '';
			const code = new URL(location, 'http://base').searchParams.get('code') ?? '';

			const tokenRes = await fetch('http://127.0.0.1:19010/reserved-claims/token', {
				method: 'POST',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					grant_type: 'authorization_code',
					code,
					redirect_uri: 'http://localhost/cb',
					client_id: 'server-aud',
				}),
			});
			const tokens = await tokenRes.json() as { 
			id_token: string; 
			profile: { iss: string; aud: string };
		};

			// Decode id_token payload
			const payloadB64 = tokens.id_token.split('.')[1] as string;
			const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as Record<string, unknown>;

			// Assert server values are present (issuer is router base URL, aud matches redirect->aud mapping)
			expect(payload['iss']).toBe('http://127.0.0.1:19010/reserved-claims');
			expect(payload['aud']).toBe('server-aud');

			// profile wrapper should also reflect server aud and issuer
			expect(tokens.profile.iss).toBe('http://127.0.0.1:19010/reserved-claims');
			expect(tokens.profile.aud).toBe('server-aud');
		} finally {
			await manager.stopAll();
		}
	});
});
