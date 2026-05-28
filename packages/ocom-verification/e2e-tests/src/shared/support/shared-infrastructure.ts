import playwright, { type Browser, type BrowserContext } from 'playwright';
import { BrowseTheWeb } from '../abilities/browse-the-web.ts';
import { performOAuth2Login } from './oauth2-login.ts';
import { cleanupTestEnvironment, initTestEnvironment, MongoDBTestServer, setMongoConnectionString, TestApiServer, TestAzuriteServer, TestCommunityViteServer, TestOAuth2Server, TestStaffViteServer } from './servers/index.ts';
import { getMongoPort } from './servers/worktree-ports.ts';

const apiDbName = 'owner-community';

let mongoDBServer: MongoDBTestServer | undefined;
let azuriteServer: TestAzuriteServer | undefined;
let oauth2Server: TestOAuth2Server | undefined;
let apiServer: TestApiServer | undefined;
let communityViteServer: TestCommunityViteServer | undefined;
let staffViteServer: TestStaffViteServer | undefined;
let apiUrl: string | undefined;
let browser: Browser | undefined;
let browserBaseUrl: string | undefined;
let authenticatedBrowserContext: BrowserContext | undefined;
let browseTheWeb: BrowseTheWeb | undefined;
let shutdownHandlersRegistered = false;

export interface InfrastructureState {
	apiUrl: string | undefined;
	browseTheWeb: BrowseTheWeb | undefined;
	staffBaseUrl: string | undefined;
	communityBaseUrl: string | undefined;
	browser: Browser | undefined;
}

export function getState(): InfrastructureState {
	return { apiUrl, browseTheWeb, staffBaseUrl: staffViteServer?.getUrl(), communityBaseUrl: browserBaseUrl, browser };
}

/**
 * Resets mutable state between scenarios without restarting servers.
 */
export async function resetScenarioState(): Promise<void> {
	if (mongoDBServer?.isRunning()) {
		await mongoDBServer.resetForScenario();
	}
}

export async function stopAll(): Promise<void> {
	if (browseTheWeb) {
		await browseTheWeb.close().catch(() => undefined);
		browseTheWeb = undefined;
	} else if (authenticatedBrowserContext) {
		await authenticatedBrowserContext.close().catch(() => undefined);
	}
	authenticatedBrowserContext = undefined;

	if (browser) {
		await browser.close().catch(() => undefined);
		browser = undefined;
	}
	if (communityViteServer) {
		await communityViteServer.stop().catch(() => undefined);
		communityViteServer = undefined;
	}
	if (staffViteServer) {
		await staffViteServer.stop().catch(() => undefined);
		staffViteServer = undefined;
	}
	if (apiServer) {
		await apiServer.stop().catch(() => undefined);
		apiServer = undefined;
	}
	if (oauth2Server) {
		await oauth2Server.stop().catch(() => undefined);
		oauth2Server = undefined;
	}
	if (mongoDBServer) {
		await mongoDBServer.stop().catch(() => undefined);
		mongoDBServer = undefined;
	}
	if (azuriteServer) {
		await azuriteServer.stop().catch(() => undefined);
		azuriteServer = undefined;
	}

	apiUrl = undefined;
	browserBaseUrl = undefined;
	cleanupTestEnvironment();
}

export async function ensureE2EServers(): Promise<void> {
	initTestEnvironment();
	registerShutdownHandlers();

	mongoDBServer ??= new MongoDBTestServer();
	azuriteServer ??= new TestAzuriteServer();
	oauth2Server ??= new TestOAuth2Server();

	const mongo = mongoDBServer;
	const azurite = azuriteServer;
	const oauth2 = oauth2Server;
	const phase1: Promise<void>[] = [];

	if (!mongo.isRunning()) {
		phase1.push(
			mongo.start({ dbName: apiDbName, port: getMongoPort() }).then(() => {
				setMongoConnectionString(mongo.getConnectionString());
			}),
		);
	}
	if (!azurite.isRunning()) {
		phase1.push(azurite.start());
	}
	if (!oauth2.isRunning()) {
		phase1.push(oauth2.start());
	}
	if (phase1.length > 0) await Promise.all(phase1);

	apiServer ??= new TestApiServer();
	communityViteServer ??= new TestCommunityViteServer();
	staffViteServer ??= new TestStaffViteServer();

	const api = apiServer;
	const communityVite = communityViteServer;
	const staffVite = staffViteServer;
	const phase2: Promise<void>[] = [];

	if (!api.isRunning()) {
		phase2.push(
			api.start().then(() => {
				apiUrl = api.getUrl();
			}),
		);
	}
	if (!communityVite.isRunning()) {
		phase2.push(communityVite.start());
	}
	if (!staffVite.isRunning()) {
		phase2.push(staffVite.start());
	}
	if (phase2.length > 0) await Promise.all(phase2);

	browserBaseUrl = communityVite.getUrl();
	apiUrl ??= api.getUrl();

	if (!browser) {
		browser = await playwright.chromium.launch({ headless: true });
	}

	await ensureAuthenticatedBrowserContext({
		baseURL: browserBaseUrl,
		ignoreHTTPSErrors: true,
		performLogin: true,
	});
}

async function ensureAuthenticatedBrowserContext(options: { baseURL?: string; ignoreHTTPSErrors: boolean; performLogin: boolean }): Promise<void> {
	if (browseTheWeb || !browser || !options.baseURL) {
		return;
	}

	if (!authenticatedBrowserContext) {
		authenticatedBrowserContext = await browser.newContext({
			baseURL: options.baseURL,
			ignoreHTTPSErrors: options.ignoreHTTPSErrors,
		});
	}

	const seedPage = await authenticatedBrowserContext.newPage();

	try {
		if (options.performLogin) {
			await performOAuth2Login(seedPage);
		}
		browseTheWeb = BrowseTheWeb.using(seedPage, authenticatedBrowserContext);
	} catch (error) {
		await authenticatedBrowserContext.close().catch(() => undefined);
		authenticatedBrowserContext = undefined;
		throw error;
	}
}

function registerShutdownHandlers(): void {
	if (shutdownHandlersRegistered) return;
	shutdownHandlersRegistered = true;

	const shutdown = (signal: string) => {
		void stopAll().finally(() => {
			process.exit(signal === 'SIGINT' ? 130 : 143);
		});
	};

	process.once('SIGINT', () => shutdown('SIGINT'));
	process.once('SIGTERM', () => shutdown('SIGTERM'));
}
