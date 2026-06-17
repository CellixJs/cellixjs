import playwright, { type Browser, type BrowserContext } from 'playwright';
import { BrowseTheWeb } from '../abilities/browse-the-web.ts';
import { performOAuth2Login } from './oauth2-login.ts';
import { clearKnownQueueMessages, stopQueueStorageService } from './queue-storage.ts';
import { cleanupTestEnvironment, initTestEnvironment, MongoDBTestServer, setMongoConnectionString, TestApiServer, TestAzuriteServer, TestCommunityViteServer, TestOAuth2Server, TestStaffViteServer } from './servers/index.ts';

let mongoDBServer: MongoDBTestServer | undefined;
let oauth2Server: TestOAuth2Server | undefined;
let azuriteBlobServer: TestAzuriteServer | undefined;
let apiServer: TestApiServer | undefined;
let communityViteServer: TestCommunityViteServer | undefined;
let staffViteServer: TestStaffViteServer | undefined;
let apiUrl: string | undefined;
let browser: Browser | undefined;
let browserBaseUrl: string | undefined;
let authenticatedBrowserContext: BrowserContext | undefined;
let browseTheWeb: BrowseTheWeb | undefined;
let shutdownHandlersRegistered = false;
let ensureServersPromise: Promise<void> | undefined;

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
 * Drops all MongoDB collections and re-seeds reference data so each
 * scenario starts from a clean baseline.
 */
export async function resetScenarioState(): Promise<void> {
	if (mongoDBServer?.isRunning()) {
		await mongoDBServer.resetForScenario();
	}
	await clearKnownQueueMessages();
}

export async function stopAll(): Promise<void> {
	ensureServersPromise = undefined;
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
	if (azuriteBlobServer) {
		await azuriteBlobServer.stop().catch(() => undefined);
		azuriteBlobServer = undefined;
	}
	await stopQueueStorageService().catch(() => undefined);
	// biome-ignore lint:useLiteralKeys
	delete process.env['AZURE_STORAGE_ACCOUNT_NAME'];
	// biome-ignore lint:useLiteralKeys
	delete process.env['AZURE_STORAGE_CONNECTION_STRING'];
	if (mongoDBServer) {
		await mongoDBServer.stop().catch(() => undefined);
		mongoDBServer = undefined;
	}
	apiUrl = undefined;
	browserBaseUrl = undefined;
	cleanupTestEnvironment();
}

export async function ensureE2EServers(): Promise<void> {
	if (ensureServersPromise) {
		return await ensureServersPromise;
	}

	ensureServersPromise = ensureE2EServersInternal();

	try {
		await ensureServersPromise;
	} catch (error) {
		ensureServersPromise = undefined;
		throw error;
	}
}

async function ensureE2EServersInternal(): Promise<void> {
	initTestEnvironment();

	registerShutdownHandlers();

	// Phase 1: Start MongoDB and OAuth2 in parallel (no interdependency)
	mongoDBServer ??= new MongoDBTestServer();
	oauth2Server ??= new TestOAuth2Server();
	const mongo = mongoDBServer;
	const oauth2 = oauth2Server;
	const phase1: Promise<void>[] = [];
	if (!mongo.isRunning()) {
		phase1.push(mongo.start().then(() => setMongoConnectionString(mongo.getConnectionString())));
	}
	if (!oauth2.isRunning()) {
		phase1.push(oauth2.start());
	}
	if (phase1.length > 0) await Promise.all(phase1);

	azuriteBlobServer ??= new TestAzuriteServer();
	if (!azuriteBlobServer.isRunning()) {
		await azuriteBlobServer.start();
	}
	// biome-ignore lint:useLiteralKeys
	process.env['AZURE_STORAGE_ACCOUNT_NAME'] = 'devstoreaccount1';
	// biome-ignore lint:useLiteralKeys
	process.env['AZURE_STORAGE_CONNECTION_STRING'] = azuriteBlobServer.getConnectionString();
	await clearKnownQueueMessages();

	// Phase 2: Start API (needs MongoDB conn string), Vite (independent), and generate token (needs OAuth2) in parallel
	apiServer ??= new TestApiServer();
	communityViteServer ??= new TestCommunityViteServer();
	staffViteServer ??= new TestStaffViteServer();
	const api = apiServer;
	const vite = communityViteServer;
	const staffVite = staffViteServer;
	const phase2: Promise<void>[] = [];
	if (!api.isRunning()) {
		phase2.push(
			api.start().then(() => {
				apiUrl = api.getUrl();
			}),
		);
	}
	if (!vite.isRunning()) {
		phase2.push(vite.start());
	}
	if (!staffVite.isRunning()) {
		phase2.push(staffVite.start());
	}
	if (phase2.length > 0) await Promise.all(phase2);

	browserBaseUrl = communityViteServer.getUrl();

	if (!apiUrl) {
		apiUrl = apiServer?.getUrl();
	}

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
