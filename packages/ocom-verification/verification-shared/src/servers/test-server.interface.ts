/**
 * Common interface for all test servers (in-process and subprocess).
 *
 * This abstraction allows acceptance-api and e2e tests to use
 * consistent server lifecycle management patterns while choosing
 * the appropriate implementation:
 *
 * - **In-process** (GraphQLTestServer): Fast, isolated, mocked services
 *   Best for: API acceptance tests, unit-like integration tests
 *
 * - **Subprocess** (PortlessServer): Full stack, realistic, real services
 *   Best for: E2E tests, full system integration tests
 */
export interface TestServer {
	/** Start the server and return when ready */
	start(): Promise<void>;

	/** Stop the server gracefully */
	stop(): Promise<void>;

	/** Check if server is currently running */
	isRunning(): boolean;

	/** Get the server URL (throws if not running) */
	getUrl(): string;
}

/**
 * Configuration options for test server startup.
 */
export interface TestServerOptions {
	/** Port to listen on (0 for random available port) */
	port?: number;

	/** Additional environment variables for subprocess servers */
	env?: Record<string, string>;

	/** Timeout for server startup (defaults to centralized config) */
	startupTimeoutMs?: number;
}
