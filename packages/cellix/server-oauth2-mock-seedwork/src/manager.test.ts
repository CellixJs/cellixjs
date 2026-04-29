import { describe, expect, it } from 'vitest';
import { createMockOAuth2Manager } from './manager.ts';
import type { MockOAuth2PortalConfig } from './types.ts';

function makeConfig(): MockOAuth2PortalConfig {
	return {
		allowedRedirectUris: new Set(['http://localhost/cb']),
		allowedRedirectUri: 'http://localhost/cb',
		redirectUriToAudience: new Map([['http://localhost/cb', 'aud']]),
		getUserProfile: () => ({ email: 'x@example.com' }),
	};
}

describe('manager unit', () => {
	it('exposes register and stopAll functions and rejects invalid names', async () => {
		const manager = createMockOAuth2Manager({ port: 0, baseUrl: 'http://127.0.0.1:0' });
		expect(typeof manager.register).toBe('function');
		expect(typeof manager.stopAll).toBe('function');

		await expect(manager.register('bad/name', makeConfig())).rejects.toThrow();
		await manager.stopAll();
	});
});
