import { describe, expect, it } from 'vitest';
import { createMockOAuth2Manager, type MockOAuth2PortalConfig } from '../src/index.ts';

function makeConfig(): MockOAuth2PortalConfig {
	return {
		allowedRedirectUris: new Set(['http://localhost/cb']),
		allowedRedirectUri: 'http://localhost/cb',
		redirectUriToAudience: new Map([['http://localhost/cb', 'aud']]),
		getUserProfile: () => ({ sub: 'sub' }),
	};
}

describe('portal name validation', () => {
	it('rejects unsafe names with path segments', async () => {
		const manager = createMockOAuth2Manager({ port: 19020, host: '127.0.0.1', baseUrl: 'http://127.0.0.1:19020' });
		const cfg = makeConfig();
		await expect(manager.register('foo/bar', cfg)).rejects.toThrow(`[server-oauth2-mock] Invalid portal name "foo/bar": must match /^[a-zA-Z0-9_-]+$/`);
	});

	it('rejects unsafe names with traversal segments', async () => {
		const manager = createMockOAuth2Manager({ port: 19021, host: '127.0.0.1', baseUrl: 'http://127.0.0.1:19021' });
		const cfg = makeConfig();
		await expect(manager.register('../admin', cfg)).rejects.toThrow(`[server-oauth2-mock] Invalid portal name "../admin": must match /^[a-zA-Z0-9_-]+$/`);
	});

	it('rejects names with disallowed characters such as dots', async () => {
		const manager = createMockOAuth2Manager({ port: 19022, host: '127.0.0.1', baseUrl: 'http://127.0.0.1:19022' });
		const cfg = makeConfig();
		await expect(manager.register('foo.bar', cfg)).rejects.toThrow(`[server-oauth2-mock] Invalid portal name "foo.bar": must match /^[a-zA-Z0-9_-]+$/`);
	});

	it('accepts names with letters, digits, underscores, and hyphens', async () => {
		const manager = createMockOAuth2Manager({ port: 19023, host: '127.0.0.1', baseUrl: 'http://127.0.0.1:19023' });
		const cfg = makeConfig();
		const result = await manager.register('admin-portal_1', cfg);
		expect(result.name).toBe('admin-portal_1');
		await manager.stopAll();
	});
});
