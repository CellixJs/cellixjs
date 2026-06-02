import { ProcessTestServer, type ProcessTestServerOptions } from './process-test-server.ts';

/** Options used by {@link AzuriteTestServer}. */
export type AzuriteTestServerOptions = ProcessTestServerOptions;

/**
 * Process-backed Azurite server for verification suites.
 *
 * All app-specific command, port, environment, and readiness details are
 * supplied by the consumer so the framework package stays ignorant of local
 * workspace conventions.
 */
export class AzuriteTestServer extends ProcessTestServer {}
