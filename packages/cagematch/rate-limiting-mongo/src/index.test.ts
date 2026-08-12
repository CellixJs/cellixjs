import type { RateLimitPolicy } from '@cagematch/rate-limiting';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceMongoRateLimiting } from './index.ts';

const mongoMock = vi.hoisted(() => {
	const collection = {
		findOne: vi.fn(),
		findOneAndUpdate: vi.fn(),
	};
	const database = { collection: vi.fn(() => collection) };
	const client = {
		connect: vi.fn(() => Promise.resolve()),
		close: vi.fn(() => Promise.resolve()),
		db: vi.fn(() => database),
	};
	return {
		collection,
		database,
		client,
		MongoClient: vi.fn(function MongoClient() {
			return client;
		}),
	};
});

vi.mock('mongodb', () => ({ MongoClient: mongoMock.MongoClient }));

describe('ServiceMongoRateLimiting', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		const env = process.env as Partial<Record<'COSMOSDB_CONNECTION_STRING', string>>;
		env.COSMOSDB_CONNECTION_STRING = 'mongodb://127.0.0.1:50000/rate-limiting';
	});

	it('creates and owns its MongoDB client from the environment', async () => {
		const service = new ServiceMongoRateLimiting([]);

		expect(mongoMock.MongoClient).toHaveBeenCalledWith('mongodb://127.0.0.1:50000/rate-limiting');
		await service.startUp();
		expect(mongoMock.client.connect).toHaveBeenCalledOnce();
		expect(mongoMock.client.db).toHaveBeenCalledWith();
		expect(mongoMock.database.collection).toHaveBeenCalledWith('rate-limits');
		await service.shutDown();
		expect(mongoMock.client.close).toHaveBeenCalledOnce();
	});

	it('requires the MongoDB connection string', () => {
		const env = process.env as Partial<Record<'COSMOSDB_CONNECTION_STRING', string>>;
		delete env.COSMOSDB_CONNECTION_STRING;

		expect(() => new ServiceMongoRateLimiting([])).toThrow('COSMOSDB_CONNECTION_STRING is required');
	});

	it('atomically increments an allowed counter without initializing the collection', async () => {
		mongoMock.collection.findOneAndUpdate.mockResolvedValue({ _id: 'key', count: 2, expiresAt: new Date('2026-08-04T15:00:00.000Z') });
		const service = new ServiceMongoRateLimiting([{ feature: 'record.create', limit: 5, windowMs: 60_000 }]);

		await service.startUp();
		const decision = await service.consume({ feature: 'record.create', subject: { id: 'user-1' }, now: new Date('2026-08-04T14:30:00.000Z') });

		expect(mongoMock.collection.findOneAndUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ count: { $lte: 4 } }),
			{
				$inc: { count: 1 },
				$setOnInsert: { expiresAt: new Date('2026-08-04T14:31:00.000Z') },
			},
			expect.objectContaining({ upsert: true, returnDocument: 'after' }),
		);
		expect(decision).toMatchObject({ allowed: true, remaining: 3 });
		expect(mongoMock.collection).not.toHaveProperty('createIndex');
	});

	it('denies when the atomic update cannot match the limit filter', async () => {
		mongoMock.collection.findOneAndUpdate.mockResolvedValue(null);
		mongoMock.collection.findOne.mockResolvedValue({ _id: 'key', count: 4, expiresAt: new Date('2026-08-04T14:31:00.000Z') });
		const service = new ServiceMongoRateLimiting([{ feature: 'record.create', limit: 5, windowMs: 60_000 }]);
		await service.startUp();

		const decision = await service.consume({ feature: 'record.create', subject: { id: 'user-1' }, cost: 2, now: new Date('2026-08-04T14:30:00.000Z') });

		expect(decision).toMatchObject({ allowed: false, remaining: 1 });
		expect(mongoMock.collection.findOne).toHaveBeenCalledOnce();
	});

	it('retries a duplicate-key upsert race without upsert', async () => {
		const duplicateKeyError = Object.assign(new Error('duplicate key'), { code: 11000 });
		mongoMock.collection.findOneAndUpdate.mockRejectedValueOnce(duplicateKeyError).mockResolvedValueOnce(null);
		mongoMock.collection.findOne.mockResolvedValue({ _id: 'key', count: 1, expiresAt: new Date() });
		const service = new ServiceMongoRateLimiting([{ feature: 'record.create', limit: 1, windowMs: 60_000 }]);
		await service.startUp();

		const decision = await service.consume({ feature: 'record.create', subject: { id: 'user-1' }, now: new Date('2026-08-04T14:30:00.000Z') });

		expect(mongoMock.collection.findOneAndUpdate).toHaveBeenNthCalledWith(2, expect.anything(), expect.anything(), { returnDocument: 'after' });
		expect(decision.allowed).toBe(false);
	});

	it('preserves fixed-window limits, subject isolation, and reset behavior', async () => {
		const documents = new Map<string, { _id: string; count: number; expiresAt: Date }>();
		mongoMock.collection.findOne.mockImplementation((filter: { _id: string }) => Promise.resolve(documents.get(filter._id) ?? null));
		mongoMock.collection.findOneAndUpdate.mockImplementation((rawFilter: unknown, rawUpdate: unknown, rawOptions?: unknown) => {
			const filter = rawFilter as { _id: string; count: { $lte: number } };
			const update = rawUpdate as { $inc: { count: number }; $setOnInsert: { expiresAt: Date } };
			const options = rawOptions as { upsert?: boolean } | undefined;
			const current = documents.get(filter._id);
			if (current && current.count > filter.count.$lte) {
				if (options?.upsert) throw Object.assign(new Error('duplicate key'), { code: 11000 });
				return Promise.resolve(null);
			}
			const next = { _id: filter._id, count: (current?.count ?? 0) + update.$inc.count, expiresAt: current?.expiresAt ?? update.$setOnInsert.expiresAt };
			documents.set(filter._id, next);
			return Promise.resolve(next);
		});
		const policies: readonly RateLimitPolicy[] = [{ feature: 'record.create', limit: 2, windowMs: 60_000 }];
		const service = new ServiceMongoRateLimiting(policies);
		const request = { feature: 'record.create', subject: { id: 'user-1' }, now: new Date('2026-08-04T14:30:15.000Z') };

		await service.startUp();
		expect(await service.consume(request)).toMatchObject({ allowed: true, remaining: 1 });
		expect(await service.consume(request)).toMatchObject({ allowed: true, remaining: 0 });
		expect(await service.consume(request)).toMatchObject({ allowed: false, remaining: 0, retryAfterMs: 45_000 });
		expect(await service.consume({ ...request, subject: { id: 'user-2' } })).toMatchObject({ allowed: true, remaining: 1 });
		expect(await service.consume({ ...request, now: new Date('2026-08-04T14:31:00.000Z') })).toMatchObject({ allowed: true, remaining: 1 });
	});
});
