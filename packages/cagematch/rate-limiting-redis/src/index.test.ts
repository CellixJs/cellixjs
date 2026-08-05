import { describe, expect, it, vi } from 'vitest';
import type { RateLimitPolicy } from '@cagematch/rate-limiting';
import { RedisRateLimitStore, ServiceRedisRateLimiting } from './index.ts';

describe('RedisRateLimitStore', () => {
	it('uses an atomic Redis EVAL operation for a fixed-window counter', async () => {
		const sendCommand = vi.fn().mockResolvedValue([1, 4]);
		const store = new RedisRateLimitStore({ sendCommand });
		const now = new Date('2026-08-04T14:30:15.000Z');

		const decision = await store.consume({ key: 'key', limit: 5, windowMs: 60_000, cost: 1, now });

		expect(sendCommand).toHaveBeenCalledWith(expect.arrayContaining(['EVAL', '1', 'key', '1', '5', '45']));
		expect(decision).toEqual({ allowed: true, remaining: 4, resetAt: new Date('2026-08-04T14:31:00.000Z') });
	});

	it('returns a denied decision from Redis without changing the public contract', async () => {
		const store = new RedisRateLimitStore({ sendCommand: vi.fn().mockResolvedValue([0, 0]) });

		const decision = await store.consume({
			key: 'key',
			limit: 1,
			windowMs: 60_000,
			cost: 1,
			now: new Date('2026-08-04T14:30:15.000Z'),
		});

		expect(decision.allowed).toBe(false);
		expect(decision.remaining).toBe(0);
	});

	it('rejects malformed Redis script responses', async () => {
		const store = new RedisRateLimitStore({ sendCommand: vi.fn().mockResolvedValue(null) });

		await expect(store.consume({ key: 'key', limit: 1, windowMs: 60_000, cost: 1, now: new Date('2026-08-04T14:30:15.000Z') })).rejects.toThrow('Invalid Redis rate-limit response');
	});
});

describe('ServiceRedisRateLimiting contender contract', () => {
	it('allows up to the limit, denies overflow, isolates subjects, and resets next window', async () => {
		const counters = new Map<string, number>();
		const client = {
			connect: vi.fn(async () => undefined),
			quit: vi.fn(async () => undefined),
			sendCommand: vi.fn((command: string[]) => {
				const key = command[3] as string;
				const increment = Number(command[4]);
				const limit = Number(command[5]);
				const current = counters.get(key) ?? 0;
				if (current + increment > limit) {
					return Promise.resolve([0, Math.max(0, limit - current)]);
				}
				const updated = current + increment;
				counters.set(key, updated);
				return Promise.resolve([1, limit - updated]);
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
});
