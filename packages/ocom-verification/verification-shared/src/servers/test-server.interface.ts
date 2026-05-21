/**
 * Common interface for all test servers (in-process and subprocess).
 * Implemented by GraphQLTestServer (in-process), PortlessServer (subprocess
 * via the portless proxy), and TestAzuriteServer.
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
