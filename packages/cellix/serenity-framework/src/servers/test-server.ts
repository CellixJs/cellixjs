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
}

/**
 * Seed function used by database-oriented test servers.
 */
export type SeedDataFunction<TContext> = (context: TContext) => Promise<void> | void;
