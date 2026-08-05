import { describe, expect, it, vi } from 'vitest';
import { resolveRedisMemoryServerConfig, startAppRedisMemoryServer } from './index.ts';

describe('resolveRedisMemoryServerConfig', () => {
	it('matches the application local-service defaults', () => {
		expect(resolveRedisMemoryServerConfig({})).toEqual({ host: '127.0.0.1', port: 51_000 });
	});

	it('accepts environment overrides and rejects invalid ports', () => {
		expect(resolveRedisMemoryServerConfig({ HOST: '0.0.0.0', PORT: '52000', REDIS_VERSION: '8.0.0' })).toEqual({ host: '0.0.0.0', port: 52_000, binaryVersion: '8.0.0' });
		expect(() => resolveRedisMemoryServerConfig({ PORT: 'not-a-port' })).toThrow('PORT must be an integer');
		expect(() => resolveRedisMemoryServerConfig({ PORT: '70000' })).toThrow('PORT must be between');
	});
});

describe('startAppRedisMemoryServer', () => {
	it('delegates the resolved app configuration to generic seedwork', async () => {
		const stop = vi.fn(async () => undefined);
		const startServer = vi.fn(async () => ({ connectionString: 'redis://127.0.0.1:51000', host: '127.0.0.1', port: 51_000, disposer: { stop } }));

		const started = await startAppRedisMemoryServer({ HOST: '127.0.0.1', PORT: '51000' }, startServer);

		expect(startServer).toHaveBeenCalledWith({ host: '127.0.0.1', port: 51_000 });
		expect(started.connectionString).toBe('redis://127.0.0.1:51000');
	});
});
