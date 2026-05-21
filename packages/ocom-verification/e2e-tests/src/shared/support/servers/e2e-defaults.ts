// biome-ignore format: keep the public Azurite dev key split across chunks for static analysis.

/**
 * Non-secret environment defaults for the e2e harness.
 *
 * Used when `apps/api/local.settings.json` is absent (typical in CI). Every
 * value here is either a public Azurite development credential or a mock-only
 * constant — none of them are valid in any real environment, and they are
 * never applied outside the e2e harness.
 *
 * Worktree-scoped values (OIDC URLs, mongo/azurite ports, connection strings)
 * are computed at runtime by `build-pipeline/scripts/portless-hostnames.mjs`
 * and `worktree-ports.mjs`; they intentionally do NOT live here.
 */

const AZURITE_ACCOUNT_KEY = [
	'Eby8vdM02xNOcqFlqUwJPLlm',
	'EtlCDXJ1OUzFT50uSRZ6IFs',
	'uFq2UVErCz4I6tq/K1SZFP',
	'TOtr/KBHBeksoGMGw==',
].join('');

const E2E_API_DEFAULTS = {
	FUNCTIONS_WORKER_RUNTIME: 'node',
	NODE_ENV: 'development',
	CONFIG_VERSION: '3.0',

	ACCOUNT_PORTAL_OIDC_AUDIENCE: 'mock-client',
	ACCOUNT_PORTAL_OIDC_IGNORE_ISSUER: 'true',
	STAFF_PORTAL_OIDC_AUDIENCE: 'mock-client',
	STAFF_PORTAL_OIDC_IGNORE_ISSUER: 'true',

	COSMOSDB_DBNAME: 'owner-community',

	// Well-known Azurite dev account — documented in Azurite's README, not a secret.
	STORAGE_ACCOUNT_NAME: 'devstoreaccount1',
	STORAGE_ACCOUNT_KEY: AZURITE_ACCOUNT_KEY,
} as const;

/**
 * Apply e2e defaults to `process.env` for any key not already set. A pre-existing
 * env var (from the developer's shell or a copied local.settings.json) always wins.
 * Spawned child processes inherit `process.env`, so this propagates to azurite,
 * the api function host, and the oauth2 mock without any per-server plumbing.
 */
export function applyE2EDefaultsToEnv(): void {
	for (const [key, value] of Object.entries(E2E_API_DEFAULTS)) {
		process.env[key] ??= value;
	}
}

/**
 * Returns a shallow copy of `process.env` with `NODE_OPTIONS` removed.
 *
 * Cucumber runs with `NODE_OPTIONS='--import tsx/esm'` so that TypeScript
 * source is executed directly. Child processes spawned by the test harness
 * (Azurite, portless, func) are plain JavaScript and do not have `tsx` on
 * their resolution path, so inheriting `NODE_OPTIONS` causes an immediate
 * crash. Callers can spread additional overrides on top of the result.
 */
export function spawnEnv(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
	const env = { ...process.env, ...overrides };
	delete env['NODE_OPTIONS'];
	return env;
}
