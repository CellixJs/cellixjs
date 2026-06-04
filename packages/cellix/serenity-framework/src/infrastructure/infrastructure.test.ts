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
	protected running = false;

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

class DeferredServer extends FakeServer {
	constructor(
		url: string,
		private readonly startGate: Promise<void>,
	) {
		super(url);
	}

	override async start(): Promise<void> {
		this.startCalls += 1;
		await this.startGate;
		this.running = true;
	}
}

class FailingServer extends FakeServer {
	override start(): Promise<void> {
		this.startCalls += 1;
		return Promise.reject(new Error('startup failed'));
	}
}

function mongoServer(url = 'mongodb://test'): FakeServer & MongoMemoryTestServer {
	return new FakeServer(url) as FakeServer & MongoMemoryTestServer;
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
	it('starts servers in dependency order and exposes them by name, wiring the factory context', async () => {
		const mongo = mongoServer();
		const graphQL = new FakeServer('http://127.0.0.1:4000/graphql');

		let graphqlSawMongoUrl: string | undefined;
		const infrastructure = ApiInfrastructure.create()
			.addServer('mongo', () => mongo, { resetForScenario: (server) => (server as FakeServer).resetForScenario() })
			.addServer(
				'graphql',
				(ctx) => {
					graphqlSawMongoUrl = ctx.server('mongo').getUrl();
					return graphQL;
				},
				{ dependsOn: ['mongo'] },
			);

		await infrastructure.ensureStarted();

		expect(graphqlSawMongoUrl).toBe('mongodb://test');
		expect(Object.keys(infrastructure.getState().servers)).toEqual(['mongo', 'graphql']);
		expect(graphQL.getUrl()).toBe('http://127.0.0.1:4000/graphql');
		expect(graphQL.startCalls).toBe(1);
	});

	it('runs a single server without a database when none is registered', async () => {
		const graphQL = new FakeServer('http://127.0.0.1:4000/graphql');

		const infrastructure = ApiInfrastructure.create().addServer('graphql', () => graphQL);

		await infrastructure.ensureStarted();
		await infrastructure.resetScenarioState();

		expect(Object.keys(infrastructure.getState().servers)).toEqual(['graphql']);
		expect(graphQL.getUrl()).toBe('http://127.0.0.1:4000/graphql');
		expect(graphQL.startCalls).toBe(1);
	});

	it('resets a server without restarting others between scenarios', async () => {
		const mongo = mongoServer();
		const graphQL = new FakeServer('http://127.0.0.1:4000/graphql');
		const infrastructure = ApiInfrastructure.create()
			.addServer('mongo', () => mongo, { resetForScenario: (server) => (server as FakeServer).resetForScenario() })
			.addServer('graphql', () => graphQL, { dependsOn: ['mongo'] });

		await infrastructure.ensureStarted();
		await infrastructure.resetScenarioState();
		await infrastructure.ensureStarted();

		expect(mongo.resetCalls).toBe(1);
		expect(graphQL.startCalls).toBe(1);
	});

	it('rejects duplicate server names', () => {
		const infrastructure = ApiInfrastructure.create().addServer('graphql', () => new FakeServer('http://127.0.0.1:4000/graphql'));

		expect(() => infrastructure.addServer('graphql', () => new FakeServer('http://127.0.0.1:4001/graphql'))).toThrow(/already registered/);
	});

	it('rejects an unknown dependency', async () => {
		const infrastructure = ApiInfrastructure.create().addServer('graphql', () => new FakeServer('http://127.0.0.1:4000/graphql'), { dependsOn: ['mongo'] });

		await expect(infrastructure.ensureStarted()).rejects.toThrow(/unknown server 'mongo'/);
	});

	it('waits for a failed startup wave to settle and stops every created server', async () => {
		let releaseStart: () => void = () => undefined;
		const startGate = new Promise<void>((resolve) => {
			releaseStart = resolve;
		});
		const slow = new DeferredServer('http://slow.test', startGate);
		const failing = new FailingServer('http://failing.test');
		const infrastructure = ApiInfrastructure.create()
			.addServer('slow', () => slow)
			.addServer('failing', () => failing);

		const starting = expect(infrastructure.ensureStarted()).rejects.toThrow('startup failed');
		await vi.waitFor(() => expect(failing.startCalls).toBe(1));
		releaseStart();

		await starting;
		expect(slow.stopCalls).toBe(1);
		expect(failing.stopCalls).toBe(1);
		expect(slow.isRunning()).toBe(false);
		expect(infrastructure.getState().servers).toEqual({});
	});
});

describe('E2EInfrastructure', () => {
	it('starts servers in dependency order, wires the factory context, and exposes all portal URLs', async () => {
		const mongo = mongoServer();
		const azurite = new FakeServer('http://127.0.0.1:10000');
		const auth = new FakeServer('https://auth.test');
		const api = new FakeServer('https://api.test/api/graphql');
		const community = new FakeServer('https://community.test');
		const staff = new FakeServer('https://staff.test');
		const { browser } = browserStubs();
		vi.mocked(chromium.launch).mockResolvedValue(browser);

		let apiSawMongoUrl: string | undefined;
		const infrastructure = E2EInfrastructure.create()
			.addServer('mongo', () => mongo, { resetForScenario: (server) => (server as FakeServer).resetForScenario() })
			.addServer('azurite', () => azurite)
			.addServer('auth', () => auth)
			.addServer(
				'api',
				(ctx) => {
					apiSawMongoUrl = ctx.server('mongo').getUrl();
					return api;
				},
				{ dependsOn: ['mongo'] },
			)
			.addUiPortal('community', () => community)
			.addUiPortal('staff', () => staff);

		await infrastructure.ensureStarted();
		await infrastructure.resetScenarioState();

		expect(apiSawMongoUrl).toBe('mongodb://test');
		expect(mongo.resetCalls).toBe(1);
		expect(infrastructure.getState().uiPortalBaseUrls).toEqual({
			community: 'https://community.test',
			staff: 'https://staff.test',
		});
		expect(api.startCalls).toBe(1);
		expect(staff.startCalls).toBe(1);
	});

	it('creates the browser ability for the registered server set, without an app-specific shape', async () => {
		const { browser } = browserStubs();
		vi.mocked(chromium.launch).mockResolvedValue(browser);

		// Deliberately a leaner set than the suite above: no Azurite server.
		const infrastructure = E2EInfrastructure.create()
			.addServer('mongo', () => mongoServer())
			.addServer('auth', () => new FakeServer('https://auth.test'))
			.addServer('api', () => new FakeServer('https://api.test/api/graphql'), { dependsOn: ['mongo'] })
			.addUiPortal('community', () => new FakeServer('https://community.test'));

		await infrastructure.ensureStarted();

		expect(infrastructure.getState().browseTheWeb).toBeDefined();
	});

	it('waits for a failed startup wave to settle and stops every created server', async () => {
		let releaseStart: () => void = () => undefined;
		const startGate = new Promise<void>((resolve) => {
			releaseStart = resolve;
		});
		const slow = new DeferredServer('http://slow.test', startGate);
		const failing = new FailingServer('http://failing.test');
		const infrastructure = E2EInfrastructure.create()
			.addServer('slow', () => slow)
			.addServer('failing', () => failing);

		const starting = expect(infrastructure.ensureStarted()).rejects.toThrow('startup failed');
		await vi.waitFor(() => expect(failing.startCalls).toBe(1));
		releaseStart();

		await starting;
		expect(slow.stopCalls).toBe(1);
		expect(failing.stopCalls).toBe(1);
		expect(slow.isRunning()).toBe(false);
		expect(infrastructure.getState().servers).toEqual({});
	});
});
