export function e2eEnv(overrides: Record<string, string> = {}): Record<string, string> {
	return {
		E2E: 'true',
		...overrides,
	};
}
