import { ProcessTestServer, type ProcessTestServerOptions } from './process-test-server.ts';

/** Options used by {@link ApiTestServer}. */
export type ApiTestServerOptions = ProcessTestServerOptions;

/**
 * Process-backed API server for verification suites.
 *
 * The framework supplies lifecycle behavior only. Consumers provide every
 * command, path, URL, readiness marker, environment value, and probe required
 * by their application.
 */
export class ApiTestServer extends ProcessTestServer {}
