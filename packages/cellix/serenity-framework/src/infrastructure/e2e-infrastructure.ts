import { type Browser, type BrowserContext, type BrowserContextOptions, chromium } from 'playwright';
import { BrowseTheWeb } from '../serenity/browse-the-web.ts';
import type { TestServer } from '../servers/test-server.ts';

/** State exposed by {@link E2EInfrastructure}. */
export interface E2EInfrastructureState {
	/** Every registered server, keyed by the name it was added with. */
	servers: Readonly<Record<string, TestServer>>;

	/** Base URLs for every registered UI portal that has started. */
	uiPortalBaseUrls: Readonly<Record<string, string>>;

	/** Browser launched for the suite, when at least one UI portal is registered. */
	browser: Browser | undefined;

	/** Browser ability assigned to Serenity actors. */
	browseTheWeb: BrowseTheWeb | undefined;
}

/** Lookup passed to server factories so a server can read its already-started dependencies. */
export interface E2EServerContext {
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

/** Factory that creates a server, optionally reading its dependencies from {@link E2EServerContext}. */
export type E2EServerFactory = (context: E2EServerContext) => TestServer;

/** Options accepted when registering a server with {@link E2EInfrastructure.addServer}. */
export interface E2EServerOptions {
	/** Names of servers that must be started before this one. */
	dependsOn?: string[];

	/** Reset this server between scenarios, e.g. clear and reseed a database. */
	resetForScenario?: (server: TestServer) => Promise<void> | void;
}

/** Options accepted when registering a UI portal with {@link E2EInfrastructure.addUiPortal}. */
export interface E2EUiPortalOptions extends E2EServerOptions {
	/**
	 * Playwright browser-context options used whenever this portal is browsed.
	 * `baseURL` defaults to the portal server's own URL, so navigation is scoped
	 * to this portal automatically. Merged over the suite-wide
	 * {@link E2EInfrastructureOptions.browserContextOptions}.
	 */
	contextOptions?: BrowserContextOptions;
}

/** Options used by {@link E2EInfrastructure.create}. */
export interface E2EInfrastructureOptions {
	/** Suite environment setup, such as starting a local proxy. Runs before any server. */
	setupEnvironment?: () => Promise<void> | void;

	/** Suite environment cleanup. Runs after all servers stop. */
	cleanupEnvironment?: () => Promise<void> | void;

	/** Launch the browser in headless mode. Defaults to `true`. */
	headless?: boolean;

	/**
	 * Browser-context options shared by every portal context, such as
	 * `ignoreHTTPSErrors`. Each portal's own `baseURL` and `contextOptions` are
	 * merged over these, so this should not set a portal-specific `baseURL`.
	 */
	browserContextOptions?: BrowserContextOptions;
}

interface ServerRegistration {
	name: string;
	factory: E2EServerFactory;
	dependsOn: string[];
	resetForScenario?: (server: TestServer) => Promise<void> | void;
	contextOptions?: BrowserContextOptions;
	isUiPortal: boolean;
}

/**
 * Lifecycle manager for browser E2E test suites.
 *
 * Servers are composed fluently with {@link addServer} and {@link addUiPortal}
 * instead of being fixed up front, so each consuming application registers only
 * the servers it needs — a database here, an auth server there, one or many UI
 * portals — and the framework owns startup ordering, scenario reset, browser
 * setup, and shutdown.
 *
 * Servers start in dependency waves: every server whose `dependsOn` is satisfied
 * starts in parallel, then the next wave, and so on. A factory receives an
 * {@link E2EServerContext} so a dependent server (for example an API) can read a
 * dependency's runtime state (for example a database connection string). The
 * browser is launched only when at least one UI portal is registered, and each
 * portal carries its own browser-context recipe — its `baseURL` is the portal's
 * own URL — so {@link newPortalContext} opens a context for any portal without a
 * caller naming the URL. The first registered portal backs the default
 * `BrowseTheWeb` ability exposed on the state.
 *
 * @example
 * ```ts
 * export const infrastructure = E2EInfrastructure
 *   .create({ browserContextOptions: { ignoreHTTPSErrors: true } })
 *   .addServer('mongo', () => new MongoMemoryTestServer({ dbName, port, replSetName, seedData }), {
 *     resetForScenario: (server) => (server as MongoMemoryTestServer).resetForScenario(),
 *   })
 *   .addServer('auth', () => createAuthServer())
 *   .addServer('api', (ctx) => createApiServer(() => ctx.server<MongoMemoryTestServer>('mongo').getConnectionString()), {
 *     dependsOn: ['mongo'],
 *   })
 *   .addUiPortal('community', () => createCommunityPortal())
 *   .addUiPortal('staff', () => createStaffPortal());
 *
 * // Browse any portal — baseURL is that portal's own URL:
 * const staffContext = await infrastructure.newPortalContext('staff');
 * ```
 */
export class E2EInfrastructure {
	private readonly registrations: ServerRegistration[] = [];
	private readonly created = new Map<string, TestServer>();
	private readonly startOrder: string[] = [];
	private readonly context: E2EServerContext = {
		server: <TServer extends TestServer = TestServer>(name: string): TServer => {
			const server = this.created.get(name);
			if (!server) {
				throw new Error(`E2EInfrastructure: server '${name}' is not available — declare it in dependsOn so it starts first`);
			}
			return server as TServer;
		},
	};

	private environmentReady = false;
	private browser: Browser | undefined;
	private browserContext: BrowserContext | undefined;
	private browseTheWeb: BrowseTheWeb | undefined;
	private shutdownHandlersRegistered = false;

	private constructor(private readonly options: E2EInfrastructureOptions) {}

	/**
	 * Create a browser E2E infrastructure manager.
	 *
	 * @param options Browser and suite-environment setup. Defaults to an empty object.
	 */
	static create(options: E2EInfrastructureOptions = {}): E2EInfrastructure {
		return new E2EInfrastructure(options);
	}

	/**
	 * Register a server.
	 *
	 * @param name Unique server name, used by `dependsOn` and {@link E2EServerContext.server}.
	 * @param factory Creates the server, with access to already-started dependencies.
	 * @param options Dependencies and optional per-scenario reset.
	 */
	addServer(name: string, factory: E2EServerFactory, options: E2EServerOptions = {}): this {
		return this.register(name, factory, options, false);
	}

	/**
	 * Register a UI portal server. Portals contribute a base URL to
	 * {@link E2EInfrastructureState.uiPortalBaseUrls} and gate browser startup.
	 *
	 * @param name Stable logical portal name, such as `community` or `staff`.
	 * @param factory Creates the portal server.
	 * @param options Dependencies, per-scenario reset, and portal-scoped browser-context options.
	 */
	addUiPortal(name: string, factory: E2EServerFactory, options: E2EUiPortalOptions = {}): this {
		return this.register(name, factory, options, true);
	}

	/**
	 * Open a fresh browser context scoped to a UI portal. `baseURL` is the
	 * portal's own URL, merged with the suite-wide and portal-specific context
	 * options, so callers navigate relative paths without naming the portal URL.
	 *
	 * @param name Name of a registered, started UI portal.
	 */
	async newPortalContext(name: string): Promise<BrowserContext> {
		const browser = await this.ensureBrowser();
		return browser.newContext(this.portalContextOptions(name));
	}

	/** Start the environment, all servers (in dependency order), and the browser ability. */
	async ensureStarted(): Promise<void> {
		this.assertDependenciesResolvable();

		try {
			await this.ensureEnvironment();
			await this.startServers();
			if (this.hasUiPortal()) {
				await this.ensureBrowserAbility();
			}
		} catch (error) {
			await this.stopAll();
			throw error;
		}
	}

	/** Reset mutable scenario state for every server that opted into a per-scenario reset. */
	async resetScenarioState(): Promise<void> {
		for (const registration of this.registrations) {
			const server = this.created.get(registration.name);
			if (registration.resetForScenario && server?.isRunning()) {
				await registration.resetForScenario(server);
			}
		}
	}

	/** Stop browser resources, every created server including partial starts, and the suite environment. */
	async stopAll(): Promise<void> {
		await this.closeBrowser();

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
	getState(): E2EInfrastructureState {
		const uiPortalBaseUrls: Record<string, string> = {};
		for (const registration of this.registrations) {
			const server = this.created.get(registration.name);
			if (registration.isUiPortal && server) {
				uiPortalBaseUrls[registration.name] = server.getUrl();
			}
		}

		return {
			servers: Object.fromEntries(this.created),
			uiPortalBaseUrls,
			browser: this.browser,
			browseTheWeb: this.browseTheWeb,
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

	private register(name: string, factory: E2EServerFactory, options: E2EUiPortalOptions, isUiPortal: boolean): this {
		if (this.registrations.some((registration) => registration.name === name)) {
			throw new Error(`E2EInfrastructure: server '${name}' is already registered`);
		}

		this.registrations.push({
			name,
			factory,
			dependsOn: options.dependsOn ?? [],
			...(options.resetForScenario && { resetForScenario: options.resetForScenario }),
			...(options.contextOptions && { contextOptions: options.contextOptions }),
			isUiPortal,
		});
		return this;
	}

	private hasUiPortal(): boolean {
		return this.registrations.some((registration) => registration.isUiPortal);
	}

	private assertDependenciesResolvable(): void {
		const names = new Set(this.registrations.map((registration) => registration.name));
		for (const registration of this.registrations) {
			for (const dependency of registration.dependsOn) {
				if (!names.has(dependency)) {
					throw new Error(`E2EInfrastructure: server '${registration.name}' depends on unknown server '${dependency}'`);
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
				throw new Error(`E2EInfrastructure: circular or unresolved dependencies among ${remaining.map((registration) => registration.name).join(', ')}`);
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

	private async closeBrowser(): Promise<void> {
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
	}

	private async ensureBrowser(): Promise<Browser> {
		this.browser ??= await chromium.launch({ headless: this.options.headless ?? true });
		return this.browser;
	}

	private portalContextOptions(name: string): BrowserContextOptions {
		const server = this.created.get(name);
		const registration = this.registrations.find((entry) => entry.name === name && entry.isUiPortal);
		if (!server || !registration) {
			throw new Error(`E2EInfrastructure: UI portal '${name}' is not a started portal`);
		}

		return { baseURL: server.getUrl(), ...this.options.browserContextOptions, ...registration.contextOptions };
	}

	private async ensureBrowserAbility(): Promise<void> {
		await this.ensureBrowser();

		if (this.browseTheWeb) {
			return;
		}

		const primaryPortal = this.registrations.find((registration) => registration.isUiPortal);
		if (!primaryPortal) {
			return;
		}

		this.browserContext = await this.newPortalContext(primaryPortal.name);
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
