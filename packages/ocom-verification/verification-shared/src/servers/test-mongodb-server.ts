import { ServiceMongoose } from '@ocom/service-mongoose';
import { MongoClient, ObjectId } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { getAllMockUsers } from '../test-data/index.ts';

const MONGO_BINARY_VERSION = '7.0.14';
const DEFAULT_DB_NAME = 'owner-community-test';
const MAX_REPLSET_START_ATTEMPTS = 5;

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
 * In-memory MongoDB replica set with a Mongoose service attached.
 * Provides the test database for acceptance tests — callers supply
 * an optional db name and seed function.
 */
export class MongoDBTestServer {
	private replSet: MongoMemoryReplSet | null = null;
	private serviceMongoose: ServiceMongoose | null = null;
	private dbName = '';

	async start(options?: MongoDBTestServerStartOptions): Promise<void> {
		this.dbName = options?.dbName ?? DEFAULT_DB_NAME;

		const config = {
			binary: { version: MONGO_BINARY_VERSION },
			replSet: { name: 'rs0', count: 1, storageEngine: 'wiredTiger' as const },
			...(options?.port && { instanceOpts: [{ port: options.port }] }),
		};

		this.replSet = await this.createReplicaSetWithRetry(config);
		const uri = this.replSet.getUri();

		this.serviceMongoose = new ServiceMongoose(uri, {
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
		await seedFn(uri, this.dbName);
	}

	getServiceMongoose(): ServiceMongoose {
		if (!this.serviceMongoose) {
			throw new Error('MongoDBTestServer not started');
		}
		return this.serviceMongoose;
	}

	getConnectionString(): string {
		if (!this.replSet) {
			throw new Error('MongoDBTestServer not started');
		}
		return this.replSet.getUri();
	}

	async stop(): Promise<void> {
		if (this.serviceMongoose) {
			await this.serviceMongoose.shutDown();
			this.serviceMongoose = null;
		}
		if (this.replSet) {
			await this.replSet.stop();
			this.replSet = null;
		}
	}

	isRunning(): boolean {
		return this.serviceMongoose !== null;
	}

	private async createReplicaSetWithRetry(config: Parameters<typeof MongoMemoryReplSet.create>[0]): Promise<MongoMemoryReplSet> {
		let lastError: unknown;

		for (let attempt = 1; attempt <= MAX_REPLSET_START_ATTEMPTS; attempt += 1) {
			try {
				return await MongoMemoryReplSet.create(config);
			} catch (error) {
				lastError = error;
				if (!this.isPortInUseError(error) || attempt === MAX_REPLSET_START_ATTEMPTS || config.instanceOpts) {
					throw error;
				}
			}
		}

		throw lastError instanceof Error ? lastError : new Error('Failed to start MongoDB replica set');
	}

	private isPortInUseError(error: unknown): boolean {
		if (!(error instanceof Error)) {
			return false;
		}

		return error.message.includes('already in use') || error.message.includes('EADDRINUSE');
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
