import { MongoMemoryTestServer, type MongoMemoryTestServerOptions } from '../servers/mongo-memory-test-server.ts';
import type { TestServer } from '../servers/test-server.ts';

/** Minimal connection shape needed for model cleanup. */
export interface ManagedMongooseConnection {
	/** Registered Mongoose model map. */
	models: Record<string, unknown>;

	/** Delete a registered Mongoose model by name. */
	deleteModel(name: string): unknown;
}

/** Minimal Mongoose service shape managed by API infrastructure. */
export interface ManagedMongooseService {
	/** Start the service. */
	startUp(): Promise<unknown> | unknown;

	/** Stop the service. */
	shutDown(): Promise<unknown> | unknown;

	/** Service internals exposing the active connection. */
	service: {
		/** Active Mongoose connection. */
		connection: ManagedMongooseConnection;
	};
}

/** Options used when API infrastructure owns a consumer-provided Mongoose service. */
export interface ApiInfrastructureMongooseOptions<TMongooseService extends ManagedMongooseService = ManagedMongooseService> {
	/** Create the service from the framework-owned MongoDB connection string. */
	createService: (connectionString: string) => TMongooseService;

	/** Clear registered models after startup. Defaults to true. */
	clearModels?: boolean;
}

/** Context supplied to the API server factory. */
export interface ApiServerFactoryContext<TMongooseService extends ManagedMongooseService = ManagedMongooseService> {
	/** Framework-owned MongoDB server, or `undefined` when none is configured. */
	mongoServer: MongoMemoryTestServer | undefined;

	/** Resolve the MongoDB connection string. Throws if no `mongoServer` is configured. */
	getMongoConnectionString: () => string;

	/** Resolve the managed Mongoose service, when configured. */
	getMongooseService: () => TMongooseService;
}

/** Factory that creates an API server after framework-owned resources are available. */
export type ApiServerFactory<TMongooseService extends ManagedMongooseService = ManagedMongooseService> = (context: ApiServerFactoryContext<TMongooseService>) => TestServer;

/** Factory used to create the framework-owned MongoDB server. */
export type ApiMongoServerFactory = (options: MongoMemoryTestServerOptions) => MongoMemoryTestServer;

/** State exposed by {@link ApiInfrastructure}. */
export interface ApiInfrastructureState<TMongooseService extends ManagedMongooseService = ManagedMongooseService> {
	/** Running MongoDB server for the suite. */
	mongoServer: MongoMemoryTestServer | undefined;

	/** Running API server for the suite. */
	apiServer: TestServer | undefined;

	/** Running Mongoose service, when configured. */
	mongooseService: TMongooseService | undefined;

	/** API endpoint URL, when the API server has started. */
	apiUrl: string | undefined;
}

/** Options used by {@link ApiInfrastructure.using}. */
export interface ApiInfrastructureOptions<TMongooseService extends ManagedMongooseService = ManagedMongooseService> {
	/** MongoDB memory server options. Omit when the suite does not need MongoDB. */
	mongoServer?: MongoMemoryTestServerOptions;

	/** Optional MongoDB server factory. Defaults to `new MongoMemoryTestServer(options)`. */
	createMongoServer?: ApiMongoServerFactory;

	/** Optional Mongoose service managed between MongoDB and the API server. */
	mongoose?: ApiInfrastructureMongooseOptions<TMongooseService>;

	/** Factory that creates the API server with access to framework-owned resources. */
	createApiServer: ApiServerFactory<TMongooseService>;
}

/**
 * Lifecycle manager for API acceptance tests.
 *
 * Use this when a suite needs only the always-present API acceptance base:
 * MongoDB plus an API server. Consumers configure the concrete server objects
 * with app-specific schema, context, services, seed data, and environment
 * values before passing factories to the framework.
 *
 * @example
 * ```ts
 * export const infrastructure = ApiInfrastructure.using({
 *   mongoServer: { dbName, port, replSetName, seedData },
 *   createApiServer: ({ getMongooseService }) => new ApolloGraphQLTestServer({ ... }),
 * });
 * ```
 */
export class ApiInfrastructure<TMongooseService extends ManagedMongooseService = ManagedMongooseService> {
	private readonly mongoServer: MongoMemoryTestServer | undefined;
	private apiServer: TestServer | undefined;
	private apiUrl: string | undefined;
	private mongooseService: TMongooseService | undefined;
	private shutdownHandlersRegistered = false;

	private constructor(private readonly options: ApiInfrastructureOptions<TMongooseService>) {
		this.mongoServer = options.mongoServer ? (options.createMongoServer ?? ((mongoOptions) => new MongoMemoryTestServer(mongoOptions)))(options.mongoServer) : undefined;
	}

	/**
	 * Create an API acceptance infrastructure manager.
	 *
	 * @param options Required MongoDB options and API server factory.
	 */
	static using<TMongooseService extends ManagedMongooseService>(options: ApiInfrastructureOptions<TMongooseService>): ApiInfrastructure<TMongooseService> {
		return new ApiInfrastructure(options);
	}

	/** Start MongoDB and the API server if they are not already running. */
	async ensureStarted(): Promise<void> {
		if (this.apiServer?.isRunning()) {
			return;
		}

		try {
			if (this.mongoServer && !this.mongoServer.isRunning()) {
				await this.mongoServer.start();
			}

			await this.ensureMongooseService();
			const apiServer = this.ensureApiServer();
			await apiServer.start();
			this.apiUrl = apiServer.getUrl();
		} catch (error) {
			await this.stopAll();
			throw error;
		}
	}

	/** Reset MongoDB between scenarios without restarting the API server. */
	async resetScenarioState(): Promise<void> {
		if (this.mongoServer?.isRunning()) {
			await this.mongoServer.resetForScenario();
		}
	}

	/** Stop the API server and MongoDB, swallowing shutdown errors from already-failed resources. */
	async stopAll(): Promise<void> {
		await this.apiServer?.stop().catch(() => undefined);
		this.apiServer = undefined;

		if (this.mongooseService) {
			await Promise.resolve(this.mongooseService.shutDown()).catch(() => undefined);
			this.mongooseService = undefined;
		}

		await this.mongoServer?.stop().catch(() => undefined);

		this.apiUrl = undefined;
	}

	/** Return the current infrastructure state. */
	getState(): ApiInfrastructureState<TMongooseService> {
		return {
			apiUrl: this.apiUrl,
			apiServer: this.apiServer,
			mongooseService: this.mongooseService,
			mongoServer: this.mongoServer,
		};
	}

	/** Register SIGINT and SIGTERM handlers that stop infrastructure before exiting. */
	registerProcessShutdownHandlers(): this {
		if (this.shutdownHandlersRegistered) {
			return this;
		}

		this.shutdownHandlersRegistered = true;
		const shutdown = (signal: NodeJS.Signals) => {
			void this.stopAll().finally(() => {
				process.exit(signal === 'SIGINT' ? 130 : 143);
			});
		};

		process.once('SIGINT', shutdown);
		process.once('SIGTERM', shutdown);
		return this;
	}

	private ensureApiServer(): TestServer {
		const { mongoServer } = this;
		this.apiServer ??= this.options.createApiServer({
			getMongoConnectionString: mongoServer
				? () => mongoServer.getConnectionString()
				: () => {
						throw new Error('ApiInfrastructure: no mongoServer configured');
					},
			getMongooseService: () => this.getMongooseService(),
			mongoServer,
		});

		return this.apiServer;
	}

	private async ensureMongooseService(): Promise<TMongooseService | undefined> {
		if (!this.options.mongoose) {
			return undefined;
		}

		if (!this.mongoServer) {
			throw new Error('ApiInfrastructure: mongoose option requires mongoServer to be configured');
		}

		if (!this.mongooseService) {
			this.mongooseService = this.options.mongoose.createService(this.mongoServer.getConnectionString());
			await this.mongooseService.startUp();
			if (this.options.mongoose.clearModels ?? true) {
				this.clearMongooseModels(this.mongooseService);
			}
		}

		return this.mongooseService;
	}

	private getMongooseService(): TMongooseService {
		if (!this.mongooseService) {
			throw new Error('ApiInfrastructure Mongoose service is not configured or has not started');
		}

		return this.mongooseService;
	}

	private clearMongooseModels(mongooseService: ManagedMongooseService): void {
		for (const modelName of Object.keys(mongooseService.service.connection.models)) {
			try {
				mongooseService.service.connection.deleteModel(modelName);
			} catch {
				/* already deleted */
			}
		}
	}
}
