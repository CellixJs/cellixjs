import type { RateLimitPolicy } from '@cagematch/rate-limiting';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceRedisRateLimiting } from './index.ts';

const redisMock = vi.hoisted(() => {
	const client = {
		isOpen: false,
		connect: vi.fn(() => {
			client.isOpen = true;
			return Promise.resolve();
		}),
		quit: vi.fn(() => {
			client.isOpen = false;
			return Promise.resolve();
		}),
		on: vi.fn(function on() {
			return client;
		}),
		consumeRateLimit: vi.fn(),
	};
	return { client, createClient: vi.fn(() => client) };
});

vi.mock('redis', async (importOriginal) => ({
	...(await importOriginal<typeof import('redis')>()),
	createClient: redisMock.createClient,
}));

describe('ServiceRedisRateLimiting', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		redisMock.client.isOpen = false;
		const env = process.env as Partial<Record<'REDIS_URL', string>>;
		delete env.REDIS_URL;
	});

	it('creates and owns a Redis client using REDIS_URL', async () => {
		const env = process.env as Partial<Record<'REDIS_URL', string>>;
		env.REDIS_URL = 'redis://127.0.0.1:51000';
		const service = new ServiceRedisRateLimiting([]);

		expect(redisMock.createClient).toHaveBeenCalledWith(expect.objectContaining({ url: 'redis://127.0.0.1:51000', scripts: { consumeRateLimit: expect.anything() } }));
		await service.startUp();
		await service.shutDown();
		expect(redisMock.client.connect).toHaveBeenCalledOnce();
		expect(redisMock.client.quit).toHaveBeenCalledOnce();
	});

	it('requires REDIS_URL when no explicit test override is supplied', () => {
		expect(() => new ServiceRedisRateLimiting([])).toThrow('REDIS_URL is required');
	});

	it('allows up to the limit, denies overflow, isolates subjects, and resets next window', async () => {
		const counters = new Map<string, number>();
		redisMock.client.consumeRateLimit.mockImplementation(({ key, cost, limit }: { key: string; cost: number; limit: number }) => {
			const current = counters.get(key) ?? 0;
			if (current + cost > limit) return Promise.resolve({ allowed: false, remaining: Math.max(0, limit - current) });
			const updated = current + cost;
			counters.set(key, updated);
			return Promise.resolve({ allowed: true, remaining: limit - updated });
		});
		const policies: readonly RateLimitPolicy[] = [{ feature: 'record.create', limit: 2, windowMs: 60_000 }];
		const service = new ServiceRedisRateLimiting(policies, { url: 'redis://example.test:6379' });
		const request = { feature: 'record.create', subject: { id: 'user-1' }, now: new Date('2026-08-04T14:30:15.000Z') };

		await service.startUp();
		expect(await service.consume(request)).toMatchObject({ allowed: true, remaining: 1 });
		expect(await service.consume(request)).toMatchObject({ allowed: true, remaining: 0 });
		expect(await service.consume(request)).toMatchObject({ allowed: false, remaining: 0, retryAfterMs: 45_000 });
		expect(await service.consume({ ...request, subject: { id: 'user-2' } })).toMatchObject({ allowed: true, remaining: 1 });
		expect(await service.consume({ ...request, now: new Date('2026-08-04T14:31:00.000Z') })).toMatchObject({ allowed: true, remaining: 1 });
	});

	it('rejects malformed Redis script responses', async () => {
		redisMock.client.consumeRateLimit.mockResolvedValue(null);
		const service = new ServiceRedisRateLimiting([{ feature: 'record.create', limit: 1, windowMs: 60_000 }], { url: 'redis://example.test:6379' });

		await service.startUp();
		await expect(service.consume({ feature: 'record.create', subject: { id: 'user-1' }, now: new Date('2026-08-04T14:30:15.000Z') })).rejects.toThrow('Invalid Redis rate-limit response');
	});
});
