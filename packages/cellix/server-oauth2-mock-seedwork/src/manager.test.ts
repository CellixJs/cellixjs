import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockOAuth2Manager, type MockOAuth2PortalConfig } from './index.ts';

function makeConfig(): MockOAuth2PortalConfig {
	return {
		allowedRedirectUris: new Set(['http://localhost/cb']),
		allowedRedirectUri: 'http://localhost/cb',
		redirectUriToAudience: new Map([['http://localhost/cb', 'aud']]),
		getUserProfile: () => ({ email: 'x@example.com' }),
	};
}

describe('createMockOAuth2Manager', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('manager unit', () => {
		it('exposes register and stopAll functions and rejects invalid names', async () => {
			const manager = createMockOAuth2Manager({ port: 0, baseUrl: 'http://127.0.0.1:0' });
			expect(typeof manager.register).toBe('function');
			expect(typeof manager.stopAll).toBe('function');

			await expect(manager.register('bad/name', makeConfig())).rejects.toThrow();
			await manager.stopAll();
		});

		it('trusts one proxy hop on the underlying express app', async () => {
			const setSpy = vi.spyOn(express.application, 'set');
			const manager = createMockOAuth2Manager({ port: 0, baseUrl: 'http://127.0.0.1:0' });

			await manager.register('portal', makeConfig());
			expect(setSpy).toHaveBeenCalledWith('trust proxy', 1);

			await manager.stopAll();
		});
	});
});
