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

/** Context supplied to the GraphQL server factory. */
export interface GraphqlServerFactoryContext<TMongooseService extends ManagedMongooseService = ManagedMongooseService> {
	/** Framework-owned MongoDB server, or `undefined` when none is configured. */
	mongoServer: MongoMemoryTestServer | undefined;

	/** Resolve the MongoDB connection string. Throws if no `mongoServer` is configured. */
	getMongoConnectionString: () => string;

	/** Resolve the managed Mongoose service. Throws if no `mongoose` option is configured. */
	getMongooseService: () => TMongooseService;
}

/** Factory that creates the GraphQL server after framework-owned resources are available. */
export type GraphqlServerFactory<TMongooseService extends ManagedMongooseService = ManagedMongooseService> = (context: GraphqlServerFactoryContext<TMongooseService>) => TestServer;

/** Factory used to create the framework-owned MongoDB server. */
export type ApiMongoServerFactory = (options: MongoMemoryTestServerOptions) => MongoMemoryTestServer;

/** State exposed by {@link ApiInfrastructure}. */
export interface ApiInfrastructureState<TMongooseService extends ManagedMongooseService = ManagedMongooseService> {
	/** Running MongoDB server, or `undefined` when none is configured. */
	mongoServer: MongoMemoryTestServer | undefined;

	/** Running GraphQL server for the suite. */
	graphqlServer: TestServer | undefined;

	/** Running Mongoose service, or `undefined` when none is configured. */
	mongooseService: TMongooseService | undefined;

	/** GraphQL endpoint URL, when the server has started. */
	graphqlUrl: string | undefined;
}

/** Options used by {@link ApiInfrastructure.using}. */
export interface ApiInfrastructureOptions<TMongooseService extends ManagedMongooseService = ManagedMongooseService> {
	/** MongoDB memory server options. Omit when the suite does not need a database. */
	mongoServer?: MongoMemoryTestServerOptions;

	/** Optional MongoDB server factory. Defaults to `new MongoMemoryTestServer(options)`. */
	createMongoServer?: ApiMongoServerFactory;

	/** Optional Mongoose service managed between MongoDB and the GraphQL server. Requires `mongoServer`. */
	mongoose?: ApiInfrastructureMongooseOptions<TMongooseService>;

	/** Factory that creates the GraphQL server with access to framework-owned resources. */
	createGraphqlServer: GraphqlServerFactory<TMongooseService>;
}

/**
 * Lifecycle manager for API acceptance tests.
 *
 * The only always-present piece is a consumer-provided GraphQL server. MongoDB
 * and a Mongoose service are both optional — omit them for an app with no
 * database, or supply `mongoServer` (and optionally `mongoose`) when the GraphQL
 * server needs persistence. Consumers configure the concrete server objects with
 * app-specific schema, context, services, seed data, and environment values
 * before passing factories to the framework.
 *
 * @example
 * ```ts
 * // With a database:
 * ApiInfrastructure.using({
 *   mongoServer: { dbName, port, replSetName, seedData },
 *   mongoose: { createService: (connectionString) => createMongooseService(connectionString) },
 *   createGraphqlServer: ({ getMongooseService }) => new ApolloGraphQLTestServer({ ... }),
 * });
 *
 * // Without a database:
 * ApiInfrastructure.using({
 *   createGraphqlServer: () => new ApolloGraphQLTestServer({ ... }),
 * });
 * ```
 */
export class ApiInfrastructure<TMongooseService extends ManagedMongooseService = ManagedMongooseService> {
	private readonly mongoServer: MongoMemoryTestServer | undefined;
	private graphqlServer: TestServer | undefined;
	private graphqlUrl: string | undefined;
	private mongooseService: TMongooseService | undefined;
	private shutdownHandlersRegistered = false;

	private constructor(private readonly options: ApiInfrastructureOptions<TMongooseService>) {
		this.mongoServer = options.mongoServer ? (options.createMongoServer ?? ((mongoOptions) => new MongoMemoryTestServer(mongoOptions)))(options.mongoServer) : undefined;
	}

	/**
	 * Create an API acceptance infrastructure manager.
	 *
	 * @param options A GraphQL server factory, plus optional MongoDB and Mongoose configuration.
	 */
	static using<TMongooseService extends ManagedMongooseService>(options: ApiInfrastructureOptions<TMongooseService>): ApiInfrastructure<TMongooseService> {
		return new ApiInfrastructure(options);
	}

	/** Start MongoDB (when configured) and the GraphQL server if they are not already running. */
	async ensureStarted(): Promise<void> {
		if (this.graphqlServer?.isRunning()) {
			return;
		}

		try {
			if (this.mongoServer && !this.mongoServer.isRunning()) {
				await this.mongoServer.start();
			}

			await this.ensureMongooseService();
			const graphqlServer = this.ensureGraphqlServer();
			await graphqlServer.start();
			this.graphqlUrl = graphqlServer.getUrl();
		} catch (error) {
			await this.stopAll();
			throw error;
		}
	}

	/** Reset MongoDB between scenarios without restarting the GraphQL server. No-op when no database is configured. */
	async resetScenarioState(): Promise<void> {
		if (this.mongoServer?.isRunning()) {
			await this.mongoServer.resetForScenario();
		}
	}

	/** Stop the GraphQL server, Mongoose service, and MongoDB, swallowing shutdown errors from already-failed resources. */
	async stopAll(): Promise<void> {
		await this.graphqlServer?.stop().catch(() => undefined);
		this.graphqlServer = undefined;

		if (this.mongooseService) {
			await Promise.resolve(this.mongooseService.shutDown()).catch(() => undefined);
			this.mongooseService = undefined;
		}

		await this.mongoServer?.stop().catch(() => undefined);

		this.graphqlUrl = undefined;
	}

	/** Return the current infrastructure state. */
	getState(): ApiInfrastructureState<TMongooseService> {
		return {
			graphqlUrl: this.graphqlUrl,
			graphqlServer: this.graphqlServer,
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

	private ensureGraphqlServer(): TestServer {
		const { mongoServer } = this;
		this.graphqlServer ??= this.options.createGraphqlServer({
			getMongoConnectionString: mongoServer
				? () => mongoServer.getConnectionString()
				: () => {
						throw new Error('ApiInfrastructure: no mongoServer configured');
					},
			getMongooseService: () => this.getMongooseService(),
			mongoServer,
		});

		return this.graphqlServer;
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
