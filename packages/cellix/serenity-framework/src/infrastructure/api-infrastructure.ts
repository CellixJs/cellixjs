import type { TestServer } from '../servers/test-server.ts';

/** Suite-level environment hooks for {@link ApiInfrastructure}. */
export interface ApiInfrastructureOptions {
	/** Suite environment setup, such as starting a local proxy. Runs before any server. */
	setupEnvironment?: () => Promise<void> | void;

	/** Suite environment cleanup. Runs after all servers stop. */
	cleanupEnvironment?: () => Promise<void> | void;
}

/** Lookup passed to server factories so a server can read its already-started dependencies. */
export interface ApiServerContext {
	/**
	 * Resolve an already-started server by name.
	 *
	 * @typeParam TServer Concrete server type, for example `MongoMemoryTestServer`.
	 * @param name Name the dependency was registered with.
	 * @throws Error when the named server has not been created yet. Declare it in
	 *   `dependsOn` so the framework starts it first.
	 */
	server<TServer extends TestServer = TestServer>(name: string): TServer;
}

/** Factory that creates a server, optionally reading its dependencies from {@link ApiServerContext}. */
export type ApiServerFactory = (context: ApiServerContext) => TestServer;

/** Options accepted when registering a server with {@link ApiInfrastructure.addServer}. */
export interface ApiServerOptions {
	/** Names of servers that must be started before this one. */
	dependsOn?: string[];

	/** Reset this server between scenarios, e.g. clear and reseed a database. */
	resetForScenario?: (server: TestServer) => Promise<void> | void;
}

/** State exposed by {@link ApiInfrastructure}. */
export interface ApiInfrastructureState {
	/** Every registered server, keyed by the name it was added with. */
	servers: Readonly<Record<string, TestServer>>;
}

interface ServerRegistration {
	name: string;
	factory: ApiServerFactory;
	dependsOn: string[];
	resetForScenario?: (server: TestServer) => Promise<void> | void;
}

/**
 * Lifecycle manager for API acceptance test suites.
 *
 * Servers are composed fluently with {@link addServer} rather than being fixed up
 * front, so each consuming suite registers only the servers it needs — a database
 * here, an ORM connection there, a GraphQL server on top — and the framework owns
 * startup ordering, scenario reset, and shutdown. The manager is ignorant of what
 * each server is: a Mongo memory server, a SQL server, an Apollo GraphQL server,
 * or anything else implementing {@link TestServer}. A suite with no database, a
 * non-Mongo database, or no GraphQL layer simply registers a different server set.
 *
 * Servers start in dependency waves: every server whose `dependsOn` is satisfied
 * starts in parallel, then the next wave, and so on. A factory receives an
 * {@link ApiServerContext} so a dependent server (for example a GraphQL server) can
 * read a dependency's runtime state (for example a database connection string).
 *
 * @example
 * ```ts
 * // With a database and a GraphQL server:
 * ApiInfrastructure.create()
 *   .addServer('mongo', () => new MongoMemoryTestServer({ dbName, port, replSetName, seedData }), {
 *     resetForScenario: (server) => (server as MongoMemoryTestServer).resetForScenario(),
 *   })
 *   .addServer('graphql', (ctx) => createGraphqlServer(() => ctx.server('mongo').getUrl()), {
 *     dependsOn: ['mongo'],
 *   });
 *
 * // Without a database:
 * ApiInfrastructure.create().addServer('graphql', () => createGraphqlServer());
 * ```
 */
export class ApiInfrastructure {
	private readonly registrations: ServerRegistration[] = [];
	private readonly created = new Map<string, TestServer>();
	private readonly startOrder: string[] = [];
	private readonly context: ApiServerContext = {
		server: <TServer extends TestServer = TestServer>(name: string): TServer => {
			const server = this.created.get(name);
			if (!server) {
				throw new Error(`ApiInfrastructure: server '${name}' is not available — declare it in dependsOn so it starts first`);
			}
			return server as TServer;
		},
	};

	private environmentReady = false;
	private shutdownHandlersRegistered = false;

	private constructor(private readonly options: ApiInfrastructureOptions) {}

	/**
	 * Create an API acceptance infrastructure manager.
	 *
	 * @param options Suite-environment setup. Defaults to an empty object.
	 */
	static create(options: ApiInfrastructureOptions = {}): ApiInfrastructure {
		return new ApiInfrastructure(options);
	}

	/**
	 * Register a server.
	 *
	 * @param name Unique server name, used by `dependsOn` and {@link ApiServerContext.server}.
	 * @param factory Creates the server, with access to already-started dependencies.
	 * @param options Dependencies and optional per-scenario reset.
	 */
	addServer(name: string, factory: ApiServerFactory, options: ApiServerOptions = {}): this {
		if (this.registrations.some((registration) => registration.name === name)) {
			throw new Error(`ApiInfrastructure: server '${name}' is already registered`);
		}

		this.registrations.push({
			name,
			factory,
			dependsOn: options.dependsOn ?? [],
			...(options.resetForScenario && { resetForScenario: options.resetForScenario }),
		});
		return this;
	}

	/** Start the environment and all servers (in dependency order) if they are not already running. */
	async ensureStarted(): Promise<void> {
		this.assertDependenciesResolvable();

		try {
			await this.ensureEnvironment();
			await this.startServers();
		} catch (error) {
			await this.stopAll();
			throw error;
		}
	}

	/** Reset mutable scenario state for every running server that opted into a per-scenario reset. */
	async resetScenarioState(): Promise<void> {
		for (const registration of this.registrations) {
			const server = this.created.get(registration.name);
			if (registration.resetForScenario && server?.isRunning()) {
				await registration.resetForScenario(server);
			}
		}
	}

	/** Stop every server (in reverse start order) and the suite environment, swallowing shutdown errors. */
	async stopAll(): Promise<void> {
		for (const name of [...this.startOrder].reverse()) {
			await this.created
				.get(name)
				?.stop()
				.catch(() => undefined);
		}
		this.created.clear();
		this.startOrder.length = 0;

		if (this.environmentReady) {
			await this.options.cleanupEnvironment?.();
			this.environmentReady = false;
		}
	}

	/** Return the current infrastructure state. */
	getState(): ApiInfrastructureState {
		return {
			servers: Object.fromEntries(this.created),
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

	private assertDependenciesResolvable(): void {
		const names = new Set(this.registrations.map((registration) => registration.name));
		for (const registration of this.registrations) {
			for (const dependency of registration.dependsOn) {
				if (!names.has(dependency)) {
					throw new Error(`ApiInfrastructure: server '${registration.name}' depends on unknown server '${dependency}'`);
				}
			}
		}
	}

	private async ensureEnvironment(): Promise<void> {
		if (this.environmentReady) {
			return;
		}

		await this.options.setupEnvironment?.();
		this.environmentReady = true;
	}

	private async startServers(): Promise<void> {
		const started = new Set(this.startOrder);
		let remaining = this.registrations.filter((registration) => !started.has(registration.name));

		while (remaining.length > 0) {
			const wave = remaining.filter((registration) => registration.dependsOn.every((dependency) => started.has(dependency)));
			if (wave.length === 0) {
				throw new Error(`ApiInfrastructure: circular or unresolved dependencies among ${remaining.map((registration) => registration.name).join(', ')}`);
			}

			await Promise.all(wave.map((registration) => this.startServer(registration)));

			for (const registration of wave) {
				started.add(registration.name);
			}
			remaining = remaining.filter((registration) => !started.has(registration.name));
		}
	}

	private async startServer(registration: ServerRegistration): Promise<void> {
		let server = this.created.get(registration.name);
		if (!server) {
			server = registration.factory(this.context);
			this.created.set(registration.name, server);
		}

		if (!server.isRunning()) {
			await server.start();
		}

		if (!this.startOrder.includes(registration.name)) {
			this.startOrder.push(registration.name);
		}
	}
}
