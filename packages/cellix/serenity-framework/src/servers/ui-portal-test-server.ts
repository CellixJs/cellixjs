import { ProcessTestServer, type ProcessTestServerOptions } from './process-test-server.ts';

/** Options used by {@link UiPortalTestServer}. */
export type UiPortalTestServerOptions = ProcessTestServerOptions;

/**
 * Generic UI portal server for browser E2E suites.
 *
 * Consumers create one instance per portal and provide every command, path,
 * readiness marker, environment value, and URL. The framework intentionally
 * does not default to any dev server, executable, or portal naming convention.
 */
export class UiPortalTestServer extends ProcessTestServer {}
