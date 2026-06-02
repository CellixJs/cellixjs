import { type Browser, type BrowserContext, chromium, type Page } from 'playwright';
import { describe, expect, it, vi } from 'vitest';

vi.mock('playwright', () => ({
	chromium: { launch: vi.fn() },
}));

import type { MongoMemoryTestServer } from '../servers/mongo-memory-test-server.ts';
import type { TestServer } from '../servers/test-server.ts';
import { ApiInfrastructure, E2EInfrastructure } from './index.ts';

class FakeServer implements TestServer {
	startCalls = 0;
	stopCalls = 0;
	resetCalls = 0;
	private running = false;

	constructor(private readonly url: string) {}

	start(): Promise<void> {
		this.startCalls += 1;
		this.running = true;
		return Promise.resolve();
	}

	stop(): Promise<void> {
		this.stopCalls += 1;
		this.running = false;
		return Promise.resolve();
	}

	isRunning(): boolean {
		return this.running;
	}

	getUrl(): string {
		return this.url;
	}

	resetForScenario(): Promise<void> {
		this.resetCalls += 1;
		return Promise.resolve();
	}
}

function mongoServer(url = 'mongodb://test'): FakeServer & MongoMemoryTestServer {
	return new FakeServer(url) as FakeServer & MongoMemoryTestServer;
}

function mongoOptions() {
	return {
		dbName: 'test',
		port: 27_017,
		replSetName: 'rs0',
	};
}

function browserStubs() {
	const page = {
		close: vi.fn(),
		isClosed: vi.fn(() => false),
	} as unknown as Page;
	const context = {
		close: vi.fn(),
		newPage: vi.fn(async () => page),
	} as unknown as BrowserContext;
	const browser = {
		close: vi.fn(),
		newContext: vi.fn(async () => context),
	} as unknown as Browser;

	return { browser, context, page };
}

describe('ApiInfrastructure', () => {
	it('starts MongoDB before the API server and exposes the API URL', async () => {
		const mongo = mongoServer();
		const graphQL = new FakeServer('http://127.0.0.1:4000/graphql');

		const infrastructure = ApiInfrastructure.using({
			createApiServer: () => graphQL,
			createMongoServer: () => mongo,
			mongoServer: mongoOptions(),
		});

		await infrastructure.ensureStarted();

		expect(infrastructure.getState().apiUrl).toBe('http://127.0.0.1:4000/graphql');
		expect(graphQL.startCalls).toBe(1);
	});

	it('resets MongoDB without restarting the GraphQL server between scenarios', async () => {
		const mongo = mongoServer();
		const graphQL = new FakeServer('http://127.0.0.1:4000/graphql');
		const infrastructure = ApiInfrastructure.using({
			createApiServer: () => graphQL,
			createMongoServer: () => mongo,
			mongoServer: mongoOptions(),
		});

		await infrastructure.ensureStarted();
		await infrastructure.resetScenarioState();
		await infrastructure.ensureStarted();

		expect(mongo.resetCalls).toBe(1);
		expect(graphQL.startCalls).toBe(1);
	});
});

describe('E2EInfrastructure', () => {
	it('requires at least one chained UI portal and exposes all portal URLs', async () => {
		const mongo = mongoServer();
		const azurite = new FakeServer('http://127.0.0.1:10000');
		const auth = new FakeServer('https://auth.test');
		const api = new FakeServer('https://api.test/api/graphql');
		const community = new FakeServer('https://community.test');
		const staff = new FakeServer('https://staff.test');
		const { browser } = browserStubs();
		vi.mocked(chromium.launch).mockResolvedValue(browser);

		const infrastructure = E2EInfrastructure.using({
			authServer: auth,
			azuriteServer: azurite,
			createApiServer: () => api,
			createMongoServer: () => mongo,
			mongoServer: mongoOptions(),
		})
			.addUiPortal('community', community)
			.addUiPortal('staff', staff);

		await infrastructure.ensureStarted();

		expect(infrastructure.getState().uiPortalBaseUrls).toEqual({
			community: 'https://community.test',
			staff: 'https://staff.test',
		});
		expect(api.startCalls).toBe(1);
		expect(staff.startCalls).toBe(1);
	});

	it('creates the browser ability without owning app login behavior', async () => {
		const mongo = mongoServer();
		const { browser } = browserStubs();
		vi.mocked(chromium.launch).mockResolvedValue(browser);

		const infrastructure = E2EInfrastructure.using({
			authServer: new FakeServer('https://auth.test'),
			azuriteServer: new FakeServer('http://127.0.0.1:10000'),
			createApiServer: () => new FakeServer('https://api.test/api/graphql'),
			createMongoServer: () => mongo,
			mongoServer: mongoOptions(),
		}).addUiPortal('community', new FakeServer('https://community.test'));

		await infrastructure.ensureStarted();

		expect(infrastructure.getState().browseTheWeb).toBeDefined();
	});
});
