export function spawnEnv(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
	const { NODE_OPTIONS: _ignored, ...baseEnv } = process.env;
	return { ...baseEnv, ...overrides };
}
