import { startMongoMemoryReplicaSet, type MongoMemoryReplicaSetDisposer } from '@cellix/server-mongodb-memory-mock-seedwork';
import { MongoClient } from 'mongodb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ServiceMongoRateLimiting } from './index.ts';

describe('ServiceMongoRateLimiting with a real MongoDB server', () => {
	let client: MongoClient;
	let disposer: MongoMemoryReplicaSetDisposer;

	beforeAll(async () => {
		const started = await startMongoMemoryReplicaSet({ port: 0, dbName: 'cagematch-rate-limiting', replSetName: 'cagematch-rate-limiting' });
		disposer = started.disposer;
		client = await MongoClient.connect(started.connectionString);
	});

	afterAll(async () => {
		await client?.close();
		await disposer?.stop();
	});

	it('executes the atomic collection update through the public contender service', async () => {
		const service = new ServiceMongoRateLimiting(() => client.db('cagematch-rate-limiting'), [{ feature: 'community.create', limit: 2, windowMs: 60_000 }]);
		const request = { feature: 'community.create', subject: { id: 'mongo-live-account', accountType: 'account' as const }, now: new Date('2026-08-05T14:30:15.000Z') };

		await service.startUp();

		expect(await service.consume(request)).toMatchObject({ allowed: true, remaining: 1 });
		expect(await service.consume(request)).toMatchObject({ allowed: true, remaining: 0 });
		expect(await service.consume(request)).toMatchObject({ allowed: false, remaining: 0, retryAfterMs: 45_000 });
	});
});
