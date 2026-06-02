import { type MongoMemoryReplicaSetConfig, type MongoMemoryReplicaSetDisposer, startMongoMemoryReplicaSet } from '@cellix/server-mongodb-memory-mock-seedwork';
import { MongoClient } from 'mongodb';
import type { SeedDataFunction, TestServer } from './test-server.ts';

/** Context supplied to Mongo seed functions. */
export interface MongoMemorySeedContext {
	/** MongoDB connection string. */
	connectionString: string;

	/** Database name used by the test server. */
	dbName: string;
}

/** Seed function used by {@link MongoMemoryTestServer}. */
export type MongoMemorySeedDataFunction = SeedDataFunction<MongoMemorySeedContext>;

/** Options used by {@link MongoMemoryTestServer}. */
export interface MongoMemoryTestServerOptions {
	/** Database name. */
	dbName: string;

	/** MongoDB port. */
	port: number;

	/** Replica set name. */
	replSetName: string;

	/** MongoDB binary version. */
	binaryVersion?: string;

	/** Optional seed function called after startup and reset. */
	seedData?: MongoMemorySeedDataFunction;
}

/**
 * Reusable in-memory MongoDB replica set for verification tests.
 *
 * The server is Cellix-only and does not attach application-specific Mongoose
 * services. Consumers can seed data through the supplied callback.
 */
export class MongoMemoryTestServer implements TestServer {
	private disposer: MongoMemoryReplicaSetDisposer | null = null;
	private connectionString = '';

	/**
	 * @param options Complete MongoDB memory replica set configuration.
	 */
	constructor(private readonly options: MongoMemoryTestServerOptions) {}

	/** Start the Mongo memory replica set. */
	async start(): Promise<void> {
		const config: MongoMemoryReplicaSetConfig = {
			dbName: this.options.dbName,
			port: this.options.port,
			replSetName: this.options.replSetName,
			...(this.options.binaryVersion && { binaryVersion: this.options.binaryVersion }),
		};

		const { connectionString, disposer } = await startMongoMemoryReplicaSet(config);
		this.disposer = disposer;
		this.connectionString = connectionString;
		await this.seed();
	}

	/** Return the MongoDB connection string. */
	getConnectionString(): string {
		if (!this.connectionString) {
			throw new Error('MongoMemoryTestServer not started');
		}
		return this.connectionString;
	}

	/** Alias for {@link getConnectionString}. */
	getUrl(): string {
		return this.getConnectionString();
	}

	/**
	 * Clear all collections and re-run seed data.
	 *
	 * @param seedData Optional seed override for this reset.
	 */
	async resetForScenario(seedData?: MongoMemorySeedDataFunction): Promise<void> {
		if (!this.connectionString) {
			throw new Error('MongoMemoryTestServer not started');
		}

		await clearDatabase({ connectionString: this.connectionString, dbName: this.options.dbName });
		await this.seed(seedData);
	}

	/** Stop the replica set. */
	async stop(): Promise<void> {
		if (this.disposer) {
			const disposer = this.disposer;
			this.disposer = null;
			await disposer.stop();
		}
		this.connectionString = '';
	}

	/** Return whether the replica set is active. */
	isRunning(): boolean {
		return this.disposer !== null;
	}

	private async seed(seedData = this.options.seedData): Promise<void> {
		await seedData?.({ connectionString: this.connectionString, dbName: this.options.dbName });
	}
}

async function clearDatabase(context: MongoMemorySeedContext): Promise<void> {
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
