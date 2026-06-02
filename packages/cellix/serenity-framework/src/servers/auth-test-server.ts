import { ProcessTestServer, type ProcessTestServerOptions } from './process-test-server.ts';

/** Options used by {@link AuthTestServer}. */
export type AuthTestServerOptions = ProcessTestServerOptions;

/**
 * Process-backed authentication server for verification suites.
 *
 * Consumers provide the complete descriptor so the framework remains ignorant
 * of local auth tools, hostnames, ports, and startup commands.
 */
export class AuthTestServer extends ProcessTestServer {}
