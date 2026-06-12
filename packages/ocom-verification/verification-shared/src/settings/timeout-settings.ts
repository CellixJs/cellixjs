/**
 * Centralized timeout configuration for all verification test packages.
 *
 * These timeouts are intentionally generous to accommodate:
 * - CI environments with limited resources
 * - First-time server startup (cold starts)
 * - Parallel test execution contention
 */
export const timeouts = {
	/** Default scenario timeout (2.5 minutes) */
	scenario: 150_000,

	/** Server startup timeout (2.5 minutes) */
	serverStartup: 150_000,

	/** Server shutdown graceful period (10 seconds) */
	serverShutdown: 10_000,

	/** Health probe timeout (3 seconds) */
	healthProbe: 3_000,

	/** Health probe retry interval (500ms) */
	healthProbeInterval: 500,

	/** UI initialization timeout (30 seconds) */
	uiInit: 30_000,

	/** UI cleanup timeout (10 seconds) */
	uiCleanup: 10_000,
} as const;

/** Type for timeout configuration keys */
export type TimeoutKey = keyof typeof timeouts;

function timeoutEnvName(key: TimeoutKey): string {
	return `TIMEOUT_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`;
}

/**
 * Get timeout value with optional override from environment.
 * Usage: TIMEOUT_SERVER_STARTUP=300000 npm test
 */
export function getTimeout(key: TimeoutKey): number {
	const envName = timeoutEnvName(key);
	const envOverride = process.env[envName];

	if (envOverride) {
		const parsed = Number(envOverride);
		if (Number.isInteger(parsed) && parsed > 0) {
			return parsed;
		}

		console.warn(`Ignoring invalid ${envName} value "${envOverride}"; expected a positive integer.`);
	}

	return timeouts[key];
}
