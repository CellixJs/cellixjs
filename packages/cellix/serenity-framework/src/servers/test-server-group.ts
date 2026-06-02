import type { TestServer } from './test-server.ts';

/** Options used by {@link TestServerGroup}. */
export interface TestServerGroupOptions {
	/** Servers required for the system under test. */
	required: TestServer[];

	/** Variable UI portal servers. */
	uiPortals?: TestServer[];
}

/**
 * Starts and stops required servers plus any number of UI portal servers.
 *
 * Required servers start before UI portals. Shutdown runs in reverse order.
 */
export class TestServerGroup implements TestServer {
	private readonly required: TestServer[];
	private readonly uiPortals: TestServer[];

	/**
	 * @param options Required servers and optional UI portals.
	 */
	constructor(options: TestServerGroupOptions) {
		this.required = options.required;
		this.uiPortals = options.uiPortals ?? [];
	}

	/** Start required servers, then all UI portal servers. */
	async start(): Promise<void> {
		await Promise.all(this.required.map((server) => server.start()));
		await Promise.all(this.uiPortals.map((server) => server.start()));
	}

	/** Stop UI portals, then required servers. */
	async stop(): Promise<void> {
		await Promise.all([...this.uiPortals].reverse().map((server) => server.stop().catch(() => undefined)));
		await Promise.all([...this.required].reverse().map((server) => server.stop().catch(() => undefined)));
	}

	/** Return whether any grouped server reports as running. */
	isRunning(): boolean {
		return [...this.required, ...this.uiPortals].some((server) => server.isRunning());
	}

	/**
	 * Server groups do not expose a single URL.
	 *
	 * @throws Error always.
	 */
	getUrl(): string {
		throw new Error('TestServerGroup does not expose a single URL');
	}
}
