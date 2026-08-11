import type { RateLimitPolicy } from '@cagematch/rate-limiting';
import { createRedisRateLimitingClient, ServiceRedisRateLimiting } from '@cagematch/rate-limiting-redis';
import { describe, expect, it, vi } from 'vitest';

describe('createRedisRateLimitingClient', () => {
	it('creates a Node Redis client with the rate-limit script registered', () => {
		const client = createRedisRateLimitingClient({ url: 'redis://127.0.0.1:51000' });

		expect(client).toBeDefined();
		expect(client.consumeRateLimit).toBeTypeOf('function');
	});

	it('routes Redis error events to the configured handler', () => {
		const onError = vi.fn();
		const client = createRedisRateLimitingClient({ url: 'redis://127.0.0.1:51000', onError });
		const error = new Error('connection lost');

		(client as unknown as { emit(event: 'error', error: Error): void }).emit('error', error);

		expect(onError).toHaveBeenCalledWith(error);
	});
});

describe('ServiceRedisRateLimiting contender contract', () => {
	it('allows up to the limit, denies overflow, isolates subjects, and resets next window', async () => {
		const counters = new Map<string, number>();
		const client = {
			connect: vi.fn(async () => undefined),
			quit: vi.fn(async () => undefined),
			consumeRateLimit: vi.fn(({ key, cost, limit }: { key: string; cost: number; limit: number; ttlSeconds: number }) => {
				const current = counters.get(key) ?? 0;
				if (current + cost > limit) {
					return Promise.resolve({ allowed: false, remaining: Math.max(0, limit - current) });
				}
				const updated = current + cost;
				counters.set(key, updated);
				return Promise.resolve({ allowed: true, remaining: limit - updated });
			}),
		};
		const policies: readonly RateLimitPolicy[] = [{ feature: 'community.create', limit: 2, windowMs: 60_000 }];
		const service = new ServiceRedisRateLimiting(client, policies);
		const accountOne = { feature: 'community.create', subject: { id: 'account-1', accountType: 'account' as const }, now: new Date('2026-08-04T14:30:15.000Z') };

		await service.startUp();
		expect(await service.consume(accountOne)).toMatchObject({ allowed: true, remaining: 1 });
		expect(await service.consume(accountOne)).toMatchObject({ allowed: true, remaining: 0 });
		expect(await service.consume(accountOne)).toMatchObject({ allowed: false, remaining: 0, retryAfterMs: 45_000 });
		expect(await service.consume({ ...accountOne, subject: { ...accountOne.subject, id: 'account-2' } })).toMatchObject({ allowed: true, remaining: 1 });
		expect(await service.consume({ ...accountOne, now: new Date('2026-08-04T14:31:00.000Z') })).toMatchObject({ allowed: true, remaining: 1 });
		await service.shutDown();
		expect(client.connect).toHaveBeenCalledOnce();
		expect(client.quit).toHaveBeenCalledOnce();
		await expect(service.consume(accountOne)).rejects.toThrow('not started');
	});

	it('rejects malformed Redis script responses', async () => {
		const client = {
			connect: vi.fn(async () => undefined),
			quit: vi.fn(async () => undefined),
			consumeRateLimit: vi.fn().mockResolvedValue(null),
		};
		const service = new ServiceRedisRateLimiting(client, [{ feature: 'community.create', limit: 1, windowMs: 60_000 }]);

		await service.startUp();
		await expect(service.consume({ feature: 'community.create', subject: { id: 'account-1', accountType: 'account' }, now: new Date('2026-08-04T14:30:15.000Z') })).rejects.toThrow('Invalid Redis rate-limit response');
	});
});
