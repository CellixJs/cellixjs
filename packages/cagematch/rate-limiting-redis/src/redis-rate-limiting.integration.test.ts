import { ServiceRedisRateLimiting } from '@cagematch/rate-limiting-redis';
import { type StartedRedisMemoryServer, startRedisMemoryServer } from '@cagematch/server-redis-memory-mock-seedwork';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('ServiceRedisRateLimiting with a real Redis server', () => {
	let redisServer: StartedRedisMemoryServer;

	beforeAll(async () => {
		redisServer = await startRedisMemoryServer({ host: '127.0.0.1' });
	});

	afterAll(async () => {
		await redisServer?.disposer.stop();
	});

	it('executes the Lua counter atomically through the public service', async () => {
		const service = new ServiceRedisRateLimiting([{ feature: 'record.create', limit: 2, windowMs: 60_000 }], { url: redisServer.connectionString });
		const request = { feature: 'record.create', subject: { id: 'redis-live-user' }, now: new Date('2026-08-05T14:30:15.000Z') };

		await service.startUp();

		expect(await service.consume(request)).toMatchObject({ allowed: true, remaining: 1 });
		expect(await service.consume(request)).toMatchObject({ allowed: true, remaining: 0 });
		expect(await service.consume(request)).toMatchObject({ allowed: false, remaining: 0, retryAfterMs: 45_000 });
		await service.shutDown();
	});
});
