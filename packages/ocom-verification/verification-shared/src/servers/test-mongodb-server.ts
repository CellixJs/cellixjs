import { type MongoMemoryReplicaSetDisposer, startMongoMemoryReplicaSet } from '@cellix/server-mongodb-memory-mock-seedwork';
import { ServiceMongoose } from '@ocom/service-mongoose';
import { MongoClient, ObjectId } from 'mongodb';
import { apiSettings } from '../settings/index.ts';
import { getAllMockUsers } from '../test-data/index.ts';

const DEFAULT_REPL_SET_NAME = 'globaldb';

export type MongoDBSeedDataFunction = (connectionString: string, dbName: string) => Promise<void>;

export interface MongoDBTestServerStartOptions {
	dbName?: string;
	port?: number;
	seedDataFn?: MongoDBSeedDataFunction;
}

export async function seedOwnerCommunityReferenceData(connectionString: string, dbName: string): Promise<void> {
	const client = new MongoClient(connectionString);
	try {
		await client.connect();
		const db = client.db(dbName);

		const users = getAllMockUsers();
		if (users.length > 0) {
			const operations = users.map((user) => ({
				updateOne: {
					filter: { _id: new ObjectId(user.id) },
					update: {
						$setOnInsert: {
							_id: new ObjectId(user.id),
							externalId: user.externalId,
							displayName: user.displayName,
							email: user.email,
							personalInformation: user.personalInformation,
							accessBlocked: user.accessBlocked,
							tags: user.tags,
							userType: user.userType,
							schemaVersion: user.schemaVersion,
							createdAt: user.createdAt,
							updatedAt: user.updatedAt,
						},
					},
					upsert: true,
				},
			}));
			await db.collection('users').bulkWrite(operations);
		}
	} finally {
		await client.close();
	}
}

/**
 * Test wrapper around the Cellix MongoDB memory mock seedwork.
 * The replica set is started by @cellix/server-mongodb-memory-mock-seedwork; this class
 * owns readiness checks, test seeding, and the Mongoose service used by tests.
 */
export class MongoDBTestServer {
	private disposer: MongoMemoryReplicaSetDisposer | null = null;
	private serviceMongoose: ServiceMongoose | null = null;
	private connectionString = '';
	private dbName = apiSettings.cosmosDbName;
	private startedByUs = false;

	async start(options?: MongoDBTestServerStartOptions): Promise<void> {
		this.dbName = options?.dbName ?? apiSettings.cosmosDbName;
		const port = options?.port ?? apiSettings.cosmosDbPort;
		const replSetName = getReplicaSetName(apiSettings.cosmosDbConnectionString) ?? DEFAULT_REPL_SET_NAME;
		this.connectionString = buildConnectionString({ port, dbName: this.dbName, replSetName });

		if (!(await MongoDBTestServer.isReachable(this.connectionString))) {
			const { disposer } = await startMongoMemoryReplicaSet({
				port,
				dbName: this.dbName,
				replSetName,
			});
			this.disposer = disposer;
			this.startedByUs = true;
		}

		this.serviceMongoose = new ServiceMongoose(this.connectionString, {
			dbName: this.dbName,
			autoIndex: true,
			autoCreate: true,
		});
		await this.serviceMongoose.startUp();

		const { connection } = this.serviceMongoose.service;
		for (const modelName of Object.keys(connection.models)) {
			try {
				connection.deleteModel(modelName);
			} catch {
				/* already deleted */
			}
		}

		const seedFn = options?.seedDataFn ?? seedOwnerCommunityReferenceData;
		await seedFn(this.connectionString, this.dbName);
	}

	getServiceMongoose(): ServiceMongoose {
		if (!this.serviceMongoose) {
			throw new Error('MongoDBTestServer not started');
		}
		return this.serviceMongoose;
	}

	getConnectionString(): string {
		if (!this.connectionString) {
			throw new Error('MongoDBTestServer not started');
		}
		return this.connectionString;
	}

	async stop(): Promise<void> {
		if (this.serviceMongoose) {
			await this.serviceMongoose.shutDown();
			this.serviceMongoose = null;
		}
		if (this.disposer && this.startedByUs) {
			const disposer = this.disposer;
			this.disposer = null;
			this.startedByUs = false;
			await disposer.stop();
		}
	}

	isRunning(): boolean {
		return this.serviceMongoose !== null;
	}

	static async isReachable(connectionString: string): Promise<boolean> {
		const client = new MongoClient(connectionString, {
			serverSelectionTimeoutMS: 3_000,
			connectTimeoutMS: 3_000,
		});

		try {
			await client.connect();
			await client.db().command({ ping: 1 });
			return true;
		} catch {
			return false;
		} finally {
			await client.close();
		}
	}

	static async seedData(connectionString: string, dbName: string): Promise<void> {
		await seedOwnerCommunityReferenceData(connectionString, dbName);
	}
}

function buildConnectionString(config: { port: number; dbName: string; replSetName: string }): string {
	return `mongodb://127.0.0.1:${config.port}/${config.dbName}?replicaSet=${config.replSetName}`;
}

function getReplicaSetName(connectionString: string): string | undefined {
	const match = /[?&]replicaSet=([^&]+)/.exec(connectionString);
	return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}
