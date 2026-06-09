import { type Browser, type BrowserContext, type BrowserContextOptions, chromium } from 'playwright';
import { BrowseTheWeb } from '../serenity/browse-the-web.ts';
import type { TestServer, UiTestServer } from '../servers/test-server.ts';

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

/** Options accepted when registering a server with {@link E2EInfrastructure.addServer}. */
export interface E2EServerOptions {
	/** Names of servers that must be started before this one. */
	dependsOn?: string[];
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
	server: TestServer;
	dependsOn: string[];
	contextOptions?: BrowserContextOptions;
	isUiPortal: boolean;
}

/** Fluent registration phase before any UI portal has been added. */
export interface E2EServerRegistrationChain {
	/**
	 * Register a non-UI server.
	 *
	 * @param name Unique server name, used by `dependsOn`.
	 * @param server Test server instance that owns its own lifecycle.
	 * @param options Dependencies.
	 */
	addServer(name: string, server: TestServer, options?: E2EServerOptions): E2EServerRegistrationChain;

	/**
	 * Register the first UI portal server and move into the UI-only registration phase.
	 *
	 * @param name Stable logical portal name, such as `community` or `staff`.
	 * @param server UI portal server instance that owns its own lifecycle.
	 * @param options Dependencies and portal-scoped browser-context options.
	 */
	addUiPortal(name: string, server: UiTestServer, options?: E2EUiPortalOptions): E2EUiPortalRegistrationChain;

	/** Freeze registration and return the runnable infrastructure. */
	finalize(): E2EInfrastructureRuntime;
}

/** Fluent registration phase after UI portal registration has started. */
export interface E2EUiPortalRegistrationChain {
	/**
	 * Register another UI portal server.
	 *
	 * @param name Stable logical portal name, such as `community` or `staff`.
	 * @param server UI portal server instance that owns its own lifecycle.
	 * @param options Dependencies and portal-scoped browser-context options.
	 */
	addUiPortal(name: string, server: UiTestServer, options?: E2EUiPortalOptions): E2EUiPortalRegistrationChain;

	/** Freeze registration and return the runnable infrastructure. */
	finalize(): E2EInfrastructureRuntime;
}

/** Runnable browser E2E infrastructure after registration is finalized. */
export interface E2EInfrastructureRuntime {
	/** Open a fresh browser context scoped to a UI portal. */
	newPortalContext(name: string): Promise<BrowserContext>;

	/** Start the environment, all servers, and the browser ability. */
	ensureStarted(): Promise<void>;

	/** Reset mutable scenario state for every running server that implements reset. */
	resetScenarioState(): Promise<void>;

	/** Stop browser resources, every created server, and the suite environment. */
	stopAll(): Promise<void>;

	/** Return the current infrastructure state. */
	getState(): E2EInfrastructureState;
}

/**
 * Lifecycle manager for browser E2E test suites.
 *
 * Servers are composed fluently with {@link addServer} and {@link addUiPortal},
 * so each consuming application registers only the server instances it needs —
 * a database here, an auth server there, one or many UI portals — and the
 * framework owns startup ordering, scenario reset, browser setup, and shutdown.
 *
 * Servers start in dependency waves: every server whose `dependsOn` is
 * satisfied starts in parallel, then the next wave, and so on. Dependencies that
 * need references to one another should receive those references through normal
 * object construction; `dependsOn` only describes startup order. The browser is
 * launched only when at least one UI portal is registered, and each portal
 * carries its own browser-context recipe — its `baseURL` is the portal's own URL
 * — so {@link newPortalContext} opens a context for any portal without a caller
 * naming the URL. The first registered portal backs the default `BrowseTheWeb`
 * ability exposed on the state.
 *
 * @example
 * ```ts
 * const mongo = new MongoMemoryTestServer({ dbName, port, replSetName, seedData });
 * const api = createApiServer(mongo);
 *
 * export const infrastructure = E2EInfrastructure
 *   .create({ browserContextOptions: { ignoreHTTPSErrors: true } })
 *   .addServer('mongo', mongo)
 *   .addServer('auth', createAuthServer())
 *   .addServer('api', api, { dependsOn: ['mongo'] })
 *   .addUiPortal('community', createCommunityPortal())
 *   .addUiPortal('staff', createStaffPortal())
 *   .finalize();
 *
 * // Browse any portal — baseURL is that portal's own URL:
 * const staffContext = await infrastructure.newPortalContext('staff');
 * ```
 */
export class E2EInfrastructure implements E2EServerRegistrationChain, E2EUiPortalRegistrationChain, E2EInfrastructureRuntime {
	private static readonly shutdownTargets = new Set<E2EInfrastructure>();

	private readonly registrations: ServerRegistration[] = [];
	private readonly created = new Map<string, TestServer>();
	private readonly startOrder: string[] = [];

	private environmentReady = false;
	private browser: Browser | undefined;
	private browserContext: BrowserContext | undefined;
	private browseTheWeb: BrowseTheWeb | undefined;
	private finalized = false;
	private uiRegistrationStarted = false;

	private constructor(private readonly options: E2EInfrastructureOptions) {}

	/**
	 * Create a browser E2E infrastructure manager.
	 *
	 * @param options Browser and suite-environment setup. Defaults to an empty object.
	 */
	static create(options: E2EInfrastructureOptions = {}): E2EServerRegistrationChain {
		return new E2EInfrastructure(options);
	}

	/**
	 * Register a server.
	 *
	 * @param name Unique server name, used by `dependsOn`.
	 * @param server Test server instance that owns its own lifecycle.
	 * @param options Dependencies and optional per-scenario reset.
	 */
	addServer(name: string, server: TestServer, options: E2EServerOptions = {}): E2EServerRegistrationChain {
		this.assertCanRegister('addServer');
		if (this.uiRegistrationStarted) {
			throw new Error('E2EInfrastructure: cannot call addServer after addUiPortal');
		}
		return this.register(name, server, options, false);
	}

	/**
	 * Register a UI portal server. Portals contribute a base URL to
	 * {@link E2EInfrastructureState.uiPortalBaseUrls} and gate browser startup.
	 *
	 * @param name Stable logical portal name, such as `community` or `staff`.
	 * @param server UI portal server instance that owns its own lifecycle.
	 * @param options Dependencies, per-scenario reset, and portal-scoped browser-context options.
	 */
	addUiPortal(name: string, server: UiTestServer, options: E2EUiPortalOptions = {}): E2EUiPortalRegistrationChain {
		this.assertCanRegister('addUiPortal');
		this.uiRegistrationStarted = true;
		return this.register(name, server, options, true);
	}

	/** Freeze registration and return the runnable infrastructure. */
	finalize(): E2EInfrastructureRuntime {
		this.finalized = true;
		const shouldRegisterShutdownHandlers = E2EInfrastructure.shutdownTargets.size === 0;
		E2EInfrastructure.shutdownTargets.add(this);
		if (shouldRegisterShutdownHandlers) {
			E2EInfrastructure.installProcessShutdownHandlers();
		}
		return this;
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
			if (server?.isRunning()) {
				await server.resetForScenario?.();
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

	private static installProcessShutdownHandlers(): void {
		const shutdown = (signal: NodeJS.Signals) => {
			void Promise.allSettled([...E2EInfrastructure.shutdownTargets].map((target) => target.stopAll())).finally(() => {
				process.exit(signal === 'SIGINT' ? 130 : 143);
			});
		};

		process.once('SIGINT', shutdown);
		process.once('SIGTERM', shutdown);
	}

	private register(name: string, server: TestServer, options: E2EUiPortalOptions, isUiPortal: boolean): this {
		if (this.registrations.some((registration) => registration.name === name)) {
			throw new Error(`E2EInfrastructure: server '${name}' is already registered`);
		}

		this.registrations.push({
			name,
			server,
			dependsOn: options.dependsOn ?? [],
			...(options.contextOptions && { contextOptions: options.contextOptions }),
			isUiPortal,
		});
		return this;
	}

	private assertCanRegister(method: string): void {
		if (this.finalized) {
			throw new Error(`E2EInfrastructure: cannot call ${method} after finalize`);
		}
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
		const server = registration.server;
		this.created.set(registration.name, server);

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
