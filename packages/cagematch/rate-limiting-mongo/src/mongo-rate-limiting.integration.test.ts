import { type MongoMemoryReplicaSetDisposer, startMongoMemoryReplicaSet } from '@cellix/server-mongodb-memory-mock-seedwork';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ServiceMongoRateLimiting } from './index.ts';

describe('ServiceMongoRateLimiting with a real MongoDB server', () => {
	let disposer: MongoMemoryReplicaSetDisposer;
	let connectionString: string;

	beforeAll(async () => {
		const started = await startMongoMemoryReplicaSet({ port: 0, dbName: 'rate-limiting', replSetName: 'rate-limiting' });
		disposer = started.disposer;
		connectionString = started.connectionString;
	}, 60_000);

	afterAll(async () => {
		await disposer?.stop();
	}, 30_000);

	it('executes the atomic update through its environment-configured client', async () => {
		const env = process.env as Partial<Record<'COSMOSDB_CONNECTION_STRING', string>>;
		env.COSMOSDB_CONNECTION_STRING = connectionString;
		const service = new ServiceMongoRateLimiting([{ feature: 'record.create', limit: 2, windowMs: 60_000 }]);
		const request = { feature: 'record.create', subject: { id: 'mongo-live-user' }, now: new Date('2026-08-05T14:30:15.000Z') };

		await service.startUp();

		expect(await service.consume(request)).toMatchObject({ allowed: true, remaining: 1 });
		expect(await service.consume(request)).toMatchObject({ allowed: true, remaining: 0 });
		expect(await service.consume(request)).toMatchObject({ allowed: false, remaining: 0, retryAfterMs: 45_000 });
		await service.shutDown();
	});
});
