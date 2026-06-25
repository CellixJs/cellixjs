import { MongoClient } from 'mongodb';
import type { SeedDataFunction } from './test-server.ts';

/** Context supplied to Mongo seed functions. */
export interface MongoMemorySeedContext {
	/** MongoDB connection string. */
	connectionString: string;

	/** Database name used by the test server. */
	dbName: string;
}

/** Seed function used by Mongo memory test servers. */
export type MongoMemorySeedDataFunction = SeedDataFunction<MongoMemorySeedContext>;

export async function clearMongoMemoryDatabase(context: MongoMemorySeedContext): Promise<void> {
	const client = new MongoClient(context.connectionString);
	try {
		await client.connect();
		const db = client.db(context.dbName);
		const collections = await db.listCollections({}, { nameOnly: true }).toArray();
		await Promise.all(collections.map((collection) => db.collection(collection.name).deleteMany({})));
	} finally {
		await client.close();
	}
}
