/**
 * Build a child-process environment while removing inherited Node loader hooks.
 *
 * This prevents test runner `NODE_OPTIONS` from leaking into app dev servers.
 *
 * @param overrides Environment variables applied after the current process env.
 */
export function createSpawnEnvironment(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
	const { NODE_OPTIONS: _ignored, ...baseEnv } = process.env;
	return { ...baseEnv, ...overrides };
}
