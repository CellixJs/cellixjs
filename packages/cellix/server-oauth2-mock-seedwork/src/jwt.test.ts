import { exportJWK, generateKeyPair, type KeyLike } from 'jose';
import { describe, expect, it } from 'vitest';
import { buildTokenResponse } from './jwt.ts';

interface TestIdTokenPayload {
	iss?: string;
	sub?: string;
	aud?: string;
}

describe('jwt.buildTokenResponse', () => {
	it('signs id_token and access_token and preserves claims', async () => {
		const { publicKey, privateKey } = await generateKeyPair('RS256');
		const publicJwk = await exportJWK(publicKey);
		const profile = { aud: 'test-aud', sub: 'user-123', email: 'u@example.com' } as Parameters<typeof buildTokenResponse>[0];

		const tokens = await buildTokenResponse(profile, privateKey as unknown as KeyLike, { alg: 'RS256', kid: publicJwk.kid ?? 'mock-key' }, 'http://localhost:9100');
		expect(tokens).toHaveProperty('id_token');
		expect(tokens).toHaveProperty('access_token');
		const idPayloadB64 = tokens.id_token.split('.')[1] as string;
		const idPayload = JSON.parse(Buffer.from(idPayloadB64, 'base64url').toString('utf-8')) as TestIdTokenPayload;
		expect(idPayload.iss).toBe('http://localhost:9100');
		expect(idPayload.sub).toBe('user-123');
		expect(idPayload.aud).toBe('test-aud');
	});
});
