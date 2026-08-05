import { startRedisMemoryServer, type StartedRedisMemoryServer } from '@cagematch/server-redis-memory-mock-seedwork';
import { createClient, type RedisClientType } from 'redis';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ServiceRedisRateLimiting } from './index.ts';

describe('ServiceRedisRateLimiting with a real Redis server', () => {
	let redisServer: StartedRedisMemoryServer;
	let client: RedisClientType;

	beforeAll(async () => {
		redisServer = await startRedisMemoryServer({ host: '127.0.0.1' });
		client = createClient({ url: redisServer.connectionString });
	});

	afterAll(async () => {
		if (client?.isOpen) {
			await client.quit();
		}
		await redisServer?.disposer.stop();
	});

	it('executes the Lua counter atomically through the public contender service', async () => {
		const service = new ServiceRedisRateLimiting(client, [{ feature: 'community.create', limit: 2, windowMs: 60_000 }]);
		const request = { feature: 'community.create', subject: { id: 'redis-live-account', accountType: 'account' as const }, now: new Date('2026-08-05T14:30:15.000Z') };

		await service.startUp();

		expect(await service.consume(request)).toMatchObject({ allowed: true, remaining: 1 });
		expect(await service.consume(request)).toMatchObject({ allowed: true, remaining: 0 });
		expect(await service.consume(request)).toMatchObject({ allowed: false, remaining: 0, retryAfterMs: 45_000 });
	});
});
