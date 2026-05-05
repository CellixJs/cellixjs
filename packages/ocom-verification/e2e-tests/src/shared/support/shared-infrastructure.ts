import { apiSettings } from '@ocom-verification/verification-shared/settings';
import playwright, { type Browser, type BrowserContext } from 'playwright';
import { BrowseTheWeb } from '../abilities/browse-the-web.ts';
import { performOAuth2Login } from './oauth2-login.ts';
import { cleanupTestEnvironment, initTestEnvironment, MongoDBTestServer, setMongoConnectionString, TestApiServer, TestCommunityViteServer, TestOAuth2Server } from './servers/index.ts';

let mongoDBServer: MongoDBTestServer | undefined;
let oauth2Server: TestOAuth2Server | undefined;
let apiServer: TestApiServer | undefined;
let communityViteServer: TestCommunityViteServer | undefined;
let apiUrl: string | undefined;
let accessToken: string | undefined;
let browser: Browser | undefined;
let browserBaseUrl: string | undefined;
let authenticatedBrowserContext: BrowserContext | undefined;
let browseTheWeb: BrowseTheWeb | undefined;
let shutdownHandlersRegistered = false;

export interface InfrastructureState {
	apiUrl: string | undefined;
	accessToken: string | undefined;
	browseTheWeb: BrowseTheWeb | undefined;
}

export function getState(): InfrastructureState {
	return { apiUrl, accessToken, browseTheWeb };
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
	apiUrl = undefined;
	browserBaseUrl = undefined;
	accessToken = undefined;
	cleanupTestEnvironment();
}

export async function ensureE2EServers(): Promise<void> {
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

	// Phase 2: Start API (needs MongoDB conn string), Vite (independent), and generate token (needs OAuth2) in parallel
	apiServer ??= new TestApiServer();
	communityViteServer ??= new TestCommunityViteServer();
	const api = apiServer;
	const vite = communityViteServer;
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
	if (!accessToken) {
		phase2.push(
			oauth2.generateAccessToken(apiSettings.accountPortalOidcAudience).then((token) => {
				accessToken = token;
			}),
		);
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
