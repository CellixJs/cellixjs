import { describe, expect, it, vi } from 'vitest';

const mongo = vi.hoisted(() => {
	const deleteMany = vi.fn(async () => undefined);
	const close = vi.fn(async () => undefined);
	const connect = vi.fn(async () => undefined);
	const toArray = vi.fn(async () => [{ name: 'users' }, { name: 'communities' }]);
	const collection = vi.fn(() => ({ deleteMany }));
	const db = vi.fn(() => ({
		collection,
		listCollections: () => ({ toArray }),
	}));
	// biome-ignore lint:useArrowFunction - MongoClient is called with `new`.
	const MongoClient = vi.fn(function () {
		return { close, connect, db };
	});

	return { close, collection, connect, db, deleteMany, MongoClient, toArray };
});

vi.mock('mongodb', () => ({
	MongoClient: mongo.MongoClient,
}));

import { MongoMemoryProcessTestServer } from './mongo-memory-process-test-server.ts';

describe('MongoMemoryProcessTestServer', () => {
	it('clears collections and reruns seed data on startup and scenario reset', async () => {
		const seedData = vi.fn(async () => undefined);
		const server = new MongoMemoryProcessTestServer({
			connectionString: 'mongodb://127.0.0.1:50000/owner-community?replicaSet=globaldb',
			cwd: process.cwd(),
			dbName: 'owner-community',
			executable: process.execPath,
			probe: false,
			readyMarker: 'READY',
			seedData,
			serverName: 'mongo process',
			shutdownTimeoutMs: 500,
			spawnArgs: ['-e', "console.log('READY'); setInterval(() => undefined, 1_000)"],
		});

		try {
			await server.start();
			await server.resetForScenario();
		} finally {
			await server.stop();
		}

		expect(seedData).toHaveBeenCalledTimes(2);
		expect(seedData).toHaveBeenCalledWith({
			connectionString: 'mongodb://127.0.0.1:50000/owner-community?replicaSet=globaldb',
			dbName: 'owner-community',
		});
		expect(mongo.deleteMany).toHaveBeenCalledTimes(4);
		expect(mongo.collection).toHaveBeenCalledWith('users');
		expect(mongo.collection).toHaveBeenCalledWith('communities');
	});
});
