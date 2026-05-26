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
