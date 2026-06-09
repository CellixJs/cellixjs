export function getPortlessDevScript(): 'dev' | 'dev:worktree' {
	return process.env['WORKTREE_NAME'] ? 'dev:worktree' : 'dev';
}

export function e2eEnv(overrides: Record<string, string> = {}): Record<string, string> {
	return {
		E2E: 'true',
		...overrides,
	};
}
