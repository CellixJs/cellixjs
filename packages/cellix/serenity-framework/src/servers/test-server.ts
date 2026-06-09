/**
 * Common contract for in-process and subprocess test servers.
 */
export interface TestServer {
	/** Start the server and resolve when it is ready. */
	start(): Promise<void>;

	/** Stop the server gracefully. */
	stop(): Promise<void>;

	/** Return whether this server instance is currently running. */
	isRunning(): boolean;

	/** Return the URL exposed by the server. */
	getUrl(): string;

	/** Reset mutable state between scenarios, when this server owns any. */
	resetForScenario?(): Promise<void> | void;
}

/**
 * Contract for browser UI portal test servers.
 */
export interface UiTestServer extends TestServer {
	/** Marker that distinguishes UI portal servers from generic test servers. */
	readonly uiPortal: true;
}

/**
 * Seed function used by database-oriented test servers.
 */
export type SeedDataFunction<TContext> = (context: TContext) => Promise<void> | void;
