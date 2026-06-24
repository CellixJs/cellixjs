import { describe, expect, it, vi } from 'vitest';

// Prepare a manager mock we can inspect
const managerMock = {
	register: vi.fn(async (_key: string, _cfg: unknown) => undefined),
	stopAll: vi.fn(async () => undefined),
};

// Mock the discovery to return two portals
vi.mock('../src/portal-discovery.ts', () => ({
	discoverPortalConfigs: () => [
		{ name: 'a', dirName: 'ui-a', clientId: 'cid-a', redirectUri: 'https://a/redirect', registrationKey: 'ui-a-a' },
		{ name: 'b', dirName: 'ui-b', clientId: 'cid-b', redirectUri: 'https://b/redirect', registrationKey: 'ui-b-b' },
	],
}));

// Mock the seedwork manager factory
vi.mock('@cellix/server-oauth2-mock-seedwork', () => ({
	createMockOAuth2Manager: (_opts: unknown) => managerMock,
	normalizeBaseUrl: (u: string) => u,
}));

// Mock users import used by index.ts
vi.mock('../src/users.ts', () => ({
	createFileUserStore: (_dir: string) => ({}),
}));

// Silence logs during test
vi.spyOn(console, 'log').mockImplementation(() => undefined);
vi.spyOn(console, 'error').mockImplementation(() => undefined);

describe('index registration flow', () => {
	it('registers all discovered portals using composed registration keys', async () => {
		// Importing the entrypoint will execute registration logic
		await import('../src/index.ts');

		expect(managerMock.register).toHaveBeenCalledTimes(2);
		expect(managerMock.register).toHaveBeenCalledWith('ui-a-a', expect.any(Object));
		expect(managerMock.register).toHaveBeenCalledWith('ui-b-b', expect.any(Object));
	});
});
