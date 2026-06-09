import type { TestServer } from '../servers/test-server.ts';

/** Suite-level environment hooks for {@link ApiInfrastructure}. */
export interface ApiInfrastructureOptions {
	/** Suite environment setup, such as starting a local proxy. Runs before any server. */
	setupEnvironment?: () => Promise<void> | void;

	/** Suite environment cleanup. Runs after all servers stop. */
	cleanupEnvironment?: () => Promise<void> | void;
}

/** Options accepted when registering a server with {@link ApiInfrastructure.addServer}. */
export interface ApiServerOptions {
	/** Names of servers that must be started before this one. */
	dependsOn?: string[];
}

/** State exposed by {@link ApiInfrastructure}. */
export interface ApiInfrastructureState {
	/** Every registered server, keyed by the name it was added with. */
	servers: Readonly<Record<string, TestServer>>;
}

interface ServerRegistration {
	name: string;
	server: TestServer;
	dependsOn: string[];
}

/** Fluent registration phase for API acceptance infrastructure. */
export interface ApiInfrastructureServerChain {
	/**
	 * Register a server.
	 *
	 * @param name Unique server name, used by `dependsOn`.
	 * @param server Test server instance that owns its own lifecycle.
	 * @param options Dependencies.
	 */
	addServer(name: string, server: TestServer, options?: ApiServerOptions): ApiInfrastructureServerChain;

	/** Freeze registration and return the runnable infrastructure. */
	finalize(): ApiInfrastructureRuntime;
}

/** Runnable API acceptance infrastructure after registration is finalized. */
export interface ApiInfrastructureRuntime {
	/** Start the environment and all servers in dependency order. */
	ensureStarted(): Promise<void>;

	/** Reset mutable scenario state for every running server that implements reset. */
	resetScenarioState(): Promise<void>;

	/** Stop every created server, including partial starts, then clean up the suite environment. */
	stopAll(): Promise<void>;

	/** Return the current infrastructure state. */
	getState(): ApiInfrastructureState;
}

/**
 * Lifecycle manager for API acceptance test suites.
 *
 * Servers are composed fluently with {@link addServer}, so each consuming suite
 * registers only the server instances it needs — a database here, an ORM
 * connection there, a GraphQL server on top — and the framework owns startup
 * ordering, scenario reset, and shutdown. The manager is ignorant of what each
 * server is: a Mongo memory server, a SQL server, an Apollo GraphQL server, or
 * anything else implementing {@link TestServer}. A suite with no database, a
 * non-Mongo database, or no GraphQL layer simply registers a different server set.
 *
 * Servers start in dependency waves: every server whose `dependsOn` is
 * satisfied starts in parallel, then the next wave, and so on. Dependencies that
 * need references to one another should receive those references through normal
 * object construction; `dependsOn` only describes startup order.
 *
 * @example
 * ```ts
 * // With a database and a GraphQL server:
 * const mongo = new MongoMemoryTestServer({ dbName, port, replSetName, seedData });
 * const graphql = createGraphqlServer(mongo);
 *
 * ApiInfrastructure.create()
 *   .addServer('mongo', mongo)
 *   .addServer('graphql', graphql, { dependsOn: ['mongo'] })
 *   .finalize();
 *
 * // Without a database:
 * ApiInfrastructure.create().addServer('graphql', createGraphqlServer()).finalize();
 * ```
 */
export class ApiInfrastructure implements ApiInfrastructureServerChain, ApiInfrastructureRuntime {
	private static readonly shutdownTargets = new Set<ApiInfrastructure>();

	private readonly registrations: ServerRegistration[] = [];
	private readonly created = new Map<string, TestServer>();
	private readonly startOrder: string[] = [];

	private environmentReady = false;
	private finalized = false;

	private constructor(private readonly options: ApiInfrastructureOptions) {}

	/**
	 * Create an API acceptance infrastructure manager.
	 *
	 * @param options Suite-environment setup. Defaults to an empty object.
	 */
	static create(options: ApiInfrastructureOptions = {}): ApiInfrastructureServerChain {
		return new ApiInfrastructure(options);
	}

	/**
	 * Register a server.
	 *
	 * @param name Unique server name, used by `dependsOn`.
	 * @param server Test server instance that owns its own lifecycle.
	 * @param options Dependencies and optional per-scenario reset.
	 */
	addServer(name: string, server: TestServer, options: ApiServerOptions = {}): ApiInfrastructureServerChain {
		this.assertCanRegister('addServer');
		if (this.registrations.some((registration) => registration.name === name)) {
			throw new Error(`ApiInfrastructure: server '${name}' is already registered`);
		}

		this.registrations.push({
			name,
			server,
			dependsOn: options.dependsOn ?? [],
		});
		return this;
	}

	/** Freeze registration and return the runnable infrastructure. */
	finalize(): ApiInfrastructureRuntime {
		this.finalized = true;
		const shouldRegisterShutdownHandlers = ApiInfrastructure.shutdownTargets.size === 0;
		ApiInfrastructure.shutdownTargets.add(this);
		if (shouldRegisterShutdownHandlers) {
			ApiInfrastructure.installProcessShutdownHandlers();
		}
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
			if (server?.isRunning()) {
				await server.resetForScenario?.();
			}
		}
	}

	/** Stop every created server, including partial starts, then clean up the suite environment. */
	async stopAll(): Promise<void> {
		const tracked = new Set(this.startOrder);
		const createdButUntracked = [...this.created.keys()].filter((name) => !tracked.has(name)).reverse();
		const stopOrder = [...createdButUntracked, ...[...this.startOrder].reverse()];

		for (const name of stopOrder) {
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

	private static installProcessShutdownHandlers(): void {
		const shutdown = (signal: NodeJS.Signals) => {
			void Promise.allSettled([...ApiInfrastructure.shutdownTargets].map((target) => target.stopAll())).finally(() => {
				process.exit(signal === 'SIGINT' ? 130 : 143);
			});
		};

		process.once('SIGINT', shutdown);
		process.once('SIGTERM', shutdown);
	}

	private assertCanRegister(method: string): void {
		if (this.finalized) {
			throw new Error(`ApiInfrastructure: cannot call ${method} after finalize`);
		}
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

			const results = await Promise.allSettled(wave.map((registration) => this.startServer(registration)));
			const failure = results.find((result) => result.status === 'rejected');
			if (failure) {
				throw failure.reason;
			}

			for (const registration of wave) {
				started.add(registration.name);
			}
			remaining = remaining.filter((registration) => !started.has(registration.name));
		}
	}

	private async startServer(registration: ServerRegistration): Promise<void> {
		const server = registration.server;
		this.created.set(registration.name, server);

		if (!server.isRunning()) {
			await server.start();
		}

		if (!this.startOrder.includes(registration.name)) {
			this.startOrder.push(registration.name);
		}
	}
}
