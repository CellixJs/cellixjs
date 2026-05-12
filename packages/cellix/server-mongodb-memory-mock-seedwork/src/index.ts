import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

export interface MongoMemoryServerConfig {
	port: number;
	dbName: string;
	replSetName: string;
	collectionsToSeed?: string[];
	seedDatabase?: (db: mongoose.Connection) => Promise<void>;
}

export async function startMockMongoDB(config: MongoMemoryServerConfig) {
	console.log('Starting MongoDB Memory Replica Set', {
		port: config.port,
		dbName: config.dbName,
		replSetName: config.replSetName,
	});

	await MongoMemoryReplSet.create({
		binary: { version: '7.0.14' },
		replSet: {
			name: config.replSetName,
			count: 1,
			storageEngine: 'wiredTiger',
		},
		instanceOpts: [{ port: config.port }],
	})
		.then(async (replicaSet) => {
			const uri = replicaSet.getUri(config.dbName);
			console.log('MongoDB Memory Replica Set ready at:', uri);

			try {
				const conn = await mongoose.connect(uri);

				if (config.collectionsToSeed && config.seedDatabase) {
					console.log('Checking for required collections:', config.collectionsToSeed);
					while (true) {
						const { db } = conn.connection;
						if (!db) {
							throw new Error('Mongoose connection has no db instance');
						}
						const collections = (await db.listCollections().toArray()).map((c) => c.name);

						if (config.collectionsToSeed.every((name) => collections.includes(name))) {
							break;
						}

						await new Promise((res) => setTimeout(res, 200));
					}
					console.log('All required collections exist, begin seeding.');
					await config.seedDatabase(conn.connection);
					console.log('Seeding complete.');
				}
			} catch (err) {
				console.error('Seeding failed:', err);
				process.exit(1);
			}
		})
		.catch((err) => {
			console.error('Error starting MongoDB Memory Replica Set:', err);
			process.exit(1);
		});
}
