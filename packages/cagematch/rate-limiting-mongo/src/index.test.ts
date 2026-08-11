import { describe, expect, it, vi } from 'vitest';
import type { RateLimitPolicy } from '@cagematch/rate-limiting';
import { MongoRateLimitStore, ServiceMongoRateLimiting, type MongoRateLimitDocument } from './index.ts';

describe('MongoRateLimitStore', () => {
	it('creates a TTL index and atomically increments an allowed counter', async () => {
		const createIndex = vi.fn().mockResolvedValue('ttl-index');
		const findOneAndUpdate = vi.fn().mockResolvedValue({ _id: 'key', count: 2, expiresAt: new Date('2026-08-04T15:00:00.000Z') });
		const collection = { createIndex, findOne: vi.fn(), findOneAndUpdate } as never;
		const store = new MongoRateLimitStore(collection);

		await store.startUp();
		const decision = await store.consume({
			key: 'key',
			limit: 5,
			windowMs: 60_000,
			cost: 1,
			now: new Date('2026-08-04T14:30:00.000Z'),
		});

		expect(createIndex).toHaveBeenCalledWith({ expiresAt: 1 }, expect.objectContaining({ expireAfterSeconds: 0 }));
		expect(findOneAndUpdate).toHaveBeenCalledWith(
			{ _id: 'key', count: { $lte: 4 } },
			{
				$inc: { count: 1 },
				$setOnInsert: { expiresAt: new Date('2026-08-04T14:31:00.000Z') },
			},
			expect.objectContaining({ upsert: true, returnDocument: 'after' }),
		);
		expect(decision).toEqual({ allowed: true, remaining: 3, resetAt: new Date('2026-08-04T14:31:00.000Z') });
	});

	it('denies when the atomic update cannot match the limit filter', async () => {
		const findOneAndUpdate = vi.fn().mockResolvedValue(null);
		const findOne = vi.fn().mockResolvedValue({ _id: 'key', count: 4, expiresAt: new Date('2026-08-04T14:31:00.000Z') });
		const collection = { createIndex: vi.fn(), findOne, findOneAndUpdate } as never;
		const store = new MongoRateLimitStore(collection);

		const decision = await store.consume({
			key: 'key',
			limit: 5,
			windowMs: 60_000,
			cost: 2,
			now: new Date('2026-08-04T14:30:00.000Z'),
		});

		expect(decision.allowed).toBe(false);
		expect(decision.remaining).toBe(1);
		expect(findOne).toHaveBeenCalledWith({ _id: 'key' });
	});

	it('retries a concurrent or limit-reached duplicate key without upsert', async () => {
		const duplicateKeyError = Object.assign(new Error('duplicate key'), { code: 11000 });
		const findOneAndUpdate = vi.fn().mockRejectedValueOnce(duplicateKeyError).mockResolvedValueOnce(null);
		const store = new MongoRateLimitStore({ createIndex: vi.fn(), findOne: vi.fn().mockResolvedValue({ _id: 'key', count: 1, expiresAt: new Date() }), findOneAndUpdate } as never);

		const decision = await store.consume({ key: 'key', limit: 1, windowMs: 60_000, cost: 1, now: new Date('2026-08-04T14:30:00.000Z') });

		expect(findOneAndUpdate).toHaveBeenNthCalledWith(2, { _id: 'key', count: { $lte: 0 } }, expect.anything(), { returnDocument: 'after' });
		expect(decision.allowed).toBe(false);
	});
});

describe('ServiceMongoRateLimiting contender contract', () => {
	it('allows up to the limit, denies overflow, isolates subjects, and resets next window', async () => {
		const documents = new Map<string, MongoRateLimitDocument>();
		const collection = {
			createIndex: vi.fn().mockResolvedValue('ttl-index'),
			findOne: vi.fn((filter: { _id: string }) => Promise.resolve(documents.get(filter._id) ?? null)),
			findOneAndUpdate: vi.fn((rawFilter: unknown, rawUpdate: unknown, rawOptions?: unknown) => {
				const filter = rawFilter as { _id: string; count: { $lte: number } };
				const update = rawUpdate as { $inc: { count: number }; $setOnInsert: { expiresAt: Date } };
				const options = rawOptions as { upsert?: boolean } | undefined;
				const current = documents.get(filter._id);
				if (current && current.count > filter.count.$lte) {
					if (options?.upsert) {
						throw Object.assign(new Error('duplicate key'), { code: 11000 });
					}
					return Promise.resolve(null);
				}
				const next = {
					_id: filter._id,
					count: (current?.count ?? 0) + update.$inc.count,
					expiresAt: current?.expiresAt ?? update.$setOnInsert.expiresAt,
				};
				documents.set(filter._id, next);
				return Promise.resolve(next);
			}),
		};
		const policies: readonly RateLimitPolicy[] = [{ feature: 'community.create', limit: 2, windowMs: 60_000 }];
		const database = { collection: vi.fn(() => collection) };
		const service = new ServiceMongoRateLimiting(database, policies);
		const accountOne = { feature: 'community.create', subject: { id: 'account-1', accountType: 'account' as const }, now: new Date('2026-08-04T14:30:15.000Z') };

		await service.startUp();
		expect(database.collection).toHaveBeenCalledWith('cagematch-rate-limits');
		expect(await service.consume(accountOne)).toMatchObject({ allowed: true, remaining: 1 });
		expect(await service.consume(accountOne)).toMatchObject({ allowed: true, remaining: 0 });
		expect(await service.consume(accountOne)).toMatchObject({ allowed: false, remaining: 0, retryAfterMs: 45_000 });
		expect(await service.consume({ ...accountOne, subject: { ...accountOne.subject, id: 'account-2' } })).toMatchObject({ allowed: true, remaining: 1 });
		expect(await service.consume({ ...accountOne, now: new Date('2026-08-04T14:31:00.000Z') })).toMatchObject({ allowed: true, remaining: 1 });
		await service.shutDown();
		await expect(service.consume(accountOne)).rejects.toThrow('not started');
	});

	it('owns the collection name and supports an infrastructure-only override', async () => {
		const collection = { createIndex: vi.fn(), findOne: vi.fn(), findOneAndUpdate: vi.fn() };
		const database = { collection: vi.fn(() => collection) };
		const service = new ServiceMongoRateLimiting(database, [], { collectionName: 'experiment-rate-limits' });

		await service.startUp();

		expect(database.collection).toHaveBeenCalledWith('experiment-rate-limits');
	});
});
