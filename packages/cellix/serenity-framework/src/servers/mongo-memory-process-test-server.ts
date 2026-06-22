import { clearMongoMemoryDatabase, type MongoMemorySeedDataFunction } from './mongo-memory-seed.ts';
import { ProcessTestServer, type ProcessTestServerOptions } from './process-test-server.ts';

/** Options used by {@link MongoMemoryProcessTestServer}. */
export interface MongoMemoryProcessTestServerOptions extends Omit<ProcessTestServerOptions, 'url'> {
	/** Database name. */
	dbName: string;

	/** MongoDB connection string exposed by the process. */
	connectionString: string | (() => string);

	/** Optional seed function called after startup and reset. */
	seedData?: MongoMemorySeedDataFunction;
}

/**
 * Process-backed MongoDB memory server with built-in scenario reset.
 *
 * Consumers own the command that starts MongoDB, while this server owns the
 * generic MongoDB contract: expose the connection string, clear collections,
 * and rerun optional seed data on startup and scenario reset.
 */
export class MongoMemoryProcessTestServer extends ProcessTestServer {
	constructor(private readonly mongoOptions: MongoMemoryProcessTestServerOptions) {
		super({
			...mongoOptions,
			url: resolveValue(mongoOptions.connectionString),
		});
	}

	/** Return the MongoDB connection string. */
	getConnectionString(): string {
		return this.getUrl();
	}

	/** Start the process and seed the database. */
	override async start(): Promise<void> {
		await super.start();
		await this.resetForScenario();
	}

	/**
	 * Clear all collections and re-run seed data.
	 *
	 * @param seedData Optional seed override for this reset.
	 */
	async resetForScenario(seedData?: MongoMemorySeedDataFunction): Promise<void> {
		const context = { connectionString: this.getConnectionString(), dbName: this.mongoOptions.dbName };
		await clearMongoMemoryDatabase(context);
		await (seedData ?? this.mongoOptions.seedData)?.(context);
	}
}

function resolveValue<T>(value: T | (() => T)): T {
	return typeof value === 'function' ? (value as () => T)() : value;
}
