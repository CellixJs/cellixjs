type E2EEnv = NodeJS.ProcessEnv & {
	E2E?: string;
};

/**
 * Returns true when the current process is running in an e2e-oriented mode.
 *
 * Shared so Vite arg building, Azure Functions local-settings sync, and
 * consumer-defined settings builders agree on what counts as "e2e" instead of
 * each re-implementing the same truthy-string check.
 *
 * @param env - Environment to inspect. Defaults to `process.env`.
 * @returns Whether `E2E` is enabled with a truthy local-dev value.
 */
export function isE2E(env: NodeJS.ProcessEnv = process.env): boolean {
	return ['1', 'true', 'yes'].includes(((env as E2EEnv).E2E ?? '').toLowerCase());
}
