import { type MongoMemoryReplicaSetConfig, type MongoMemoryReplicaSetDisposer, startMongoMemoryReplicaSet } from '@cellix/server-mongodb-memory-mock-seedwork';
import { ServiceMongoose } from '@ocom/service-mongoose';
import { type MongoDBSeedContext, type MongoDBSeedDataFunction, seedDatabase } from '@ocom-verification/verification-shared/test-data';
import { MongoClient } from 'mongodb';

const DEFAULT_DB_NAME = 'owner-community';
const DEFAULT_MONGO_PORT = 50_000;
const DEFAULT_REPL_SET_NAME = 'globaldb';

export type { MongoDBSeedDataFunction };

export interface MongoDBTestServerStartOptions {
	dbName?: string;
	port?: number;
	replSetName?: string;
	binaryVersion?: string;
	attachMongoose?: boolean;
	seedData?: MongoDBSeedDataFunction;
}

/**
 * In-memory MongoDB replica set for verification tests.
 */
export class MongoDBTestServer {
	private disposer: MongoMemoryReplicaSetDisposer | null = null;
	private serviceMongoose: ServiceMongoose | null = null;
	private connectionString = '';
	private dbName = DEFAULT_DB_NAME;
	private seedData: MongoDBSeedDataFunction = seedDatabase;

	async start(options?: MongoDBTestServerStartOptions): Promise<void> {
		const config: MongoMemoryReplicaSetConfig = {
			port: options?.port ?? DEFAULT_MONGO_PORT,
			dbName: options?.dbName ?? DEFAULT_DB_NAME,
			replSetName: options?.replSetName ?? DEFAULT_REPL_SET_NAME,
			...(options?.binaryVersion && { binaryVersion: options.binaryVersion }),
		};

		this.dbName = config.dbName;
		this.seedData = options?.seedData ?? seedDatabase;

		const { connectionString, disposer } = await startMongoMemoryReplicaSet(config);
		this.disposer = disposer;
		this.connectionString = connectionString;
		await this.seed();

		if (options?.attachMongoose) {
			await this.attachMongoose();
		}
	}

	getServiceMongoose(): ServiceMongoose {
		if (!this.serviceMongoose) {
			throw new Error('MongoDBTestServer Mongoose service not attached');
		}
		return this.serviceMongoose;
	}

	getConnectionString(): string {
		if (!this.connectionString) {
			throw new Error('MongoDBTestServer not started');
		}
		return this.connectionString;
	}

	async resetForScenario(seedData?: MongoDBSeedDataFunction): Promise<void> {
		if (!this.connectionString) {
			throw new Error('MongoDBTestServer not started');
		}

		await clearDatabase({ connectionString: this.connectionString, dbName: this.dbName });
		await this.seed(seedData);
	}

	async stop(): Promise<void> {
		if (this.serviceMongoose) {
			await this.serviceMongoose.shutDown();
			this.serviceMongoose = null;
		}
		if (this.disposer) {
			const disposer = this.disposer;
			this.disposer = null;
			await disposer.stop();
		}
		this.connectionString = '';
	}

	isRunning(): boolean {
		return this.disposer !== null;
	}

	private async attachMongoose(): Promise<void> {
		this.serviceMongoose = new ServiceMongoose(this.connectionString, {
			dbName: this.dbName,
			autoIndex: true,
			autoCreate: true,
		});
		await this.serviceMongoose.startUp();
		this.clearMongooseModels();
	}

	private clearMongooseModels(): void {
		const connection = this.serviceMongoose?.service.connection;
		if (!connection) return;

		for (const modelName of Object.keys(connection.models)) {
			try {
				connection.deleteModel(modelName);
			} catch {
				/* already deleted */
			}
		}
	}

	private async seed(seedData = this.seedData): Promise<void> {
		await seedData({ connectionString: this.connectionString, dbName: this.dbName });
	}
}

async function clearDatabase(context: MongoDBSeedContext): Promise<void> {
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
