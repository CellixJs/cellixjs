/**
 * Centralized timeout configuration for all verification test packages.
 *
 * These timeouts are intentionally generous to accommodate:
 * - CI environments with limited resources
 * - First-time server startup (cold starts)
 * - Parallel test execution contention
 */
export const timeouts = {
	/** Default scenario timeout (2 minutes) */
	scenario: 120_000,

	/** Server startup timeout (2 minutes) */
	serverStartup: 120_000,

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

/**
 * Get timeout value with optional override from environment.
 * Usage: TIMEOUT_SERVER_STARTUP=300000 npm test
 */
export function getTimeout(key: TimeoutKey): number {
	const envOverride = process.env[`TIMEOUT_${key.toUpperCase()}`];
	if (envOverride) {
		const parsed = Number.parseInt(envOverride, 10);
		if (!Number.isNaN(parsed)) {
			return parsed;
		}
	}
	return timeouts[key];
}
