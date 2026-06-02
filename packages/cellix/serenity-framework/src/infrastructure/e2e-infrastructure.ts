import { type Browser, type BrowserContext, type BrowserContextOptions, chromium } from 'playwright';
import { BrowseTheWeb } from '../serenity/browse-the-web.ts';
import { MongoMemoryTestServer, type MongoMemoryTestServerOptions } from '../servers/mongo-memory-test-server.ts';
import type { TestServer } from '../servers/test-server.ts';

/** UI portal registration used by {@link E2EInfrastructure}. */
export interface UiPortalRegistration<TName extends string = string> {
	/** Stable logical portal name, such as `community` or `staff`. */
	name: TName;

	/** Server that exposes the portal. */
	server: TestServer;
}

/** State exposed by {@link E2EInfrastructure}. */
export interface E2EInfrastructureState {
	/** Running MongoDB server. */
	mongoServer: MongoMemoryTestServer | undefined;

	/** Running Azurite server. */
	azuriteServer: TestServer | undefined;

	/** Running auth server. */
	authServer: TestServer | undefined;

	/** Running API server. */
	apiServer: TestServer | undefined;

	/** API URL resolved from the API server. */
	apiUrl: string | undefined;

	/** Browser launched for the suite. */
	browser: Browser | undefined;

	/** Browser ability assigned to Serenity actors. */
	browseTheWeb: BrowseTheWeb | undefined;

	/** Base URLs for every registered UI portal. */
	uiPortalBaseUrls: Readonly<Record<string, string>>;
}

/** Context supplied to E2E infrastructure callbacks. */
export interface E2EInfrastructureCallbackContext {
	/** Running MongoDB server, or `undefined` when none is configured. */
	mongoServer: MongoMemoryTestServer | undefined;

	/** Running Azurite server. */
	azuriteServer: TestServer;

	/** Running auth server. */
	authServer: TestServer;

	/** Running API server, when phase two has started. */
	apiServer?: TestServer;

	/** Resolve the MongoDB connection string after MongoDB has started. */
	getMongoConnectionString: () => string;
}

/** Factory that creates an API server once framework-owned MongoDB exists. */
export type E2EApiServerFactory = (context: E2EInfrastructureCallbackContext) => TestServer;

/** Factory used to create the framework-owned MongoDB server. */
export type E2EMongoServerFactory = (options: MongoMemoryTestServerOptions) => MongoMemoryTestServer;

/** Options used by {@link E2EInfrastructure.using}. */
export interface E2EInfrastructureOptions {
	/** MongoDB memory server options. Omit when the suite does not need MongoDB. */
	mongoServer?: MongoMemoryTestServerOptions;

	/** Optional MongoDB server factory. Defaults to `new MongoMemoryTestServer(options)`. */
	createMongoServer?: E2EMongoServerFactory;

	/** Azurite server required by the suite. */
	azuriteServer: TestServer;

	/** Auth server required by the suite. */
	authServer: TestServer;

	/** Factory that creates the API server with access to framework-owned MongoDB. */
	createApiServer: E2EApiServerFactory;

	/** Suite environment setup, such as starting a local proxy. */
	setupEnvironment?: () => Promise<void> | void;

	/** Suite environment cleanup. */
	cleanupEnvironment?: () => Promise<void> | void;

	/** Launch the browser in headless mode. Defaults to `true`. */
	headless?: boolean;

	/** Browser context options for the authenticated context. */
	browserContextOptions?: BrowserContextOptions | ((state: E2EInfrastructureState) => BrowserContextOptions);
}

/**
 * Lifecycle manager for browser E2E test suites.
 *
 * The manager requires the base servers that every full-system verification
 * suite needs: MongoDB, Azurite, auth, API, and at least one UI portal. Extra
 * portals can be chained with {@link addUiPortal}, matching Cellix application
 * startup APIs where the invariant pieces are required up front and optional
 * pieces are registered fluently.
 *
 * @example
 * ```ts
 * export const infrastructure = E2EInfrastructure
 *   .using({
 *     mongoServer: { dbName, port, replSetName, seedData },
 *     azuriteServer,
 *     authServer,
 *     createApiServer: ({ getMongoConnectionString }) => createApiServer(getMongoConnectionString),
 *   })
 *   .addUiPortal('community', communityPortal)
 *   .addUiPortal('staff', staffPortal);
 * ```
 */
export class E2EInfrastructure {
	private readonly uiPortals = new Map<string, TestServer>();
	private readonly mongoServer: MongoMemoryTestServer | undefined;
	private apiServer: TestServer | undefined;
	private environmentReady = false;
	private apiUrl: string | undefined;
	private browser: Browser | undefined;
	private browserContext: BrowserContext | undefined;
	private browseTheWeb: BrowseTheWeb | undefined;
	private shutdownHandlersRegistered = false;

	private constructor(private readonly options: E2EInfrastructureOptions) {
		this.mongoServer = options.mongoServer ? (options.createMongoServer ?? ((mongoOptions) => new MongoMemoryTestServer(mongoOptions)))(options.mongoServer) : undefined;
	}

	/**
	 * Create a browser E2E infrastructure manager.
	 *
	 * @param options Required base servers and browser setup.
	 */
	static using(options: E2EInfrastructureOptions): E2EInfrastructure {
		return new E2EInfrastructure(options);
	}

	/**
	 * Register another UI portal server.
	 *
	 * @param name Stable logical portal name.
	 * @param server Portal server.
	 */
	addUiPortal(name: string, server: TestServer): this {
		if (this.uiPortals.has(name)) {
			throw new Error(`UI portal '${name}' is already registered`);
		}

		this.uiPortals.set(name, server);
		return this;
	}

	/** Start the environment, base servers, UI portals, browser, and browser ability. */
	async ensureStarted(): Promise<void> {
		if (this.uiPortals.size === 0) {
			throw new Error('E2EInfrastructure requires at least one UI portal');
		}

		try {
			await this.ensureEnvironment();
			await this.startFoundationServers();
			await this.startApplicationServers();
			await this.ensureBrowserAbility();
		} catch (error) {
			await this.stopAll();
			throw error;
		}
	}

	/** Reset mutable scenario state without restarting servers or the browser. */
	async resetScenarioState(): Promise<void> {
		if (this.mongoServer?.isRunning()) {
			await this.mongoServer.resetForScenario();
		}
	}

	/** Stop browser resources, UI portals, base servers, and suite environment. */
	async stopAll(): Promise<void> {
		if (this.browseTheWeb) {
			await this.browseTheWeb.close().catch(() => undefined);
			this.browseTheWeb = undefined;
			this.browserContext = undefined;
		} else if (this.browserContext) {
			await this.browserContext.close().catch(() => undefined);
			this.browserContext = undefined;
		}

		if (this.browser) {
			await this.browser.close().catch(() => undefined);
			this.browser = undefined;
		}

		await Promise.all([...this.uiPortals.values()].reverse().map((server) => server.stop().catch(() => undefined)));
		await this.apiServer?.stop().catch(() => undefined);
		await this.options.authServer.stop().catch(() => undefined);
		await this.mongoServer?.stop().catch(() => undefined);
		await this.options.azuriteServer.stop().catch(() => undefined);

		this.apiUrl = undefined;
		this.apiServer = undefined;

		if (this.environmentReady) {
			await this.options.cleanupEnvironment?.();
			this.environmentReady = false;
		}
	}

	/** Return the current infrastructure state. */
	getState(): E2EInfrastructureState {
		const uiPortalBaseUrls = Object.fromEntries([...this.uiPortals].map(([name, server]) => [name, server.getUrl()]));

		return {
			apiServer: this.apiServer,
			apiUrl: this.apiUrl,
			authServer: this.options.authServer,
			browseTheWeb: this.browseTheWeb,
			browser: this.browser,
			mongoServer: this.mongoServer,
			azuriteServer: this.options.azuriteServer,
			uiPortalBaseUrls,
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

	private async ensureEnvironment(): Promise<void> {
		if (this.environmentReady) {
			return;
		}

		await this.options.setupEnvironment?.();
		this.environmentReady = true;
	}

	private async startFoundationServers(): Promise<void> {
		await Promise.all([
			this.mongoServer && !this.mongoServer.isRunning() ? this.mongoServer.start() : undefined,
			this.options.azuriteServer.isRunning() ? undefined : this.options.azuriteServer.start(),
			this.options.authServer.isRunning() ? undefined : this.options.authServer.start(),
		]);
	}

	private async startApplicationServers(): Promise<void> {
		const apiServer = this.ensureApiServer();
		await Promise.all([apiServer.isRunning() ? undefined : apiServer.start(), ...[...this.uiPortals.values()].map((server) => (server.isRunning() ? undefined : server.start()))]);

		this.apiUrl = apiServer.getUrl();
	}

	private ensureApiServer(): TestServer {
		const { mongoServer } = this;
		this.apiServer ??= this.options.createApiServer({
			authServer: this.options.authServer,
			azuriteServer: this.options.azuriteServer,
			getMongoConnectionString: mongoServer
				? () => mongoServer.getConnectionString()
				: () => {
						throw new Error('E2EInfrastructure: no mongoServer configured');
					},
			mongoServer,
		});

		return this.apiServer;
	}

	private async ensureBrowserAbility(): Promise<void> {
		if (!this.browser) {
			this.browser = await chromium.launch({ headless: this.options.headless ?? true });
		}

		if (this.browseTheWeb) {
			return;
		}

		const state = this.getState();
		const contextOptions = typeof this.options.browserContextOptions === 'function' ? this.options.browserContextOptions(state) : this.options.browserContextOptions;
		this.browserContext = await this.browser.newContext(contextOptions);
		const page = await this.browserContext.newPage();

		try {
			this.browseTheWeb = BrowseTheWeb.using(page, this.browserContext);
		} catch (error) {
			await this.browserContext.close().catch(() => undefined);
			this.browserContext = undefined;
			throw error;
		}
	}
}
