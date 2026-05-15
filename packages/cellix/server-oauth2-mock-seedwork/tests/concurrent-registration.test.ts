import { describe, expect, it, vi } from 'vitest';
import { createMockOAuth2Manager, type MockOAuth2PortalConfig } from '../src/index.ts';

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

describe('concurrent registration', () => {
	it('allows multiple concurrent register() calls and only starts server once', async () => {
		const port = 38400;
		const manager = createMockOAuth2Manager({ port, host: 'localhost', baseUrl: `http://localhost:${port}` });
		const cfg1 = makeConfig(38410);
		const cfg2 = makeConfig(38411);
		const cfg3 = makeConfig(38412);

		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
		try {
			const results = await Promise.all([manager.register('a', cfg1), manager.register('b', cfg2), manager.register('c', cfg3)]);

			// All registrations should succeed
			expect(results.length).toBe(3);
			expect(results.map((r) => r.name).sort()).toEqual(['a', 'b', 'c']);

			// Ensure server start log was printed exactly once
			const startCalls = logSpy.mock.calls.filter((c) => typeof c[0] === 'string' && (c[0] as string).includes('Mock OAuth2 server running on')).length;
			expect(startCalls).toBe(1);
		} finally {
			logSpy.mockRestore();
			await manager.stopAll();
		}
	});
});
