export interface BuildViteArgsOptions {
	host?: string;
	port?: string;
	env?: NodeJS.ProcessEnv;
}

/**
 * Returns true when the current process is running in an e2e-oriented mode.
 */
export function isE2E(env: NodeJS.ProcessEnv = process.env): boolean {
	return ['1', 'true', 'yes'].includes((env['E2E'] ?? '').toLowerCase());
}

/**
 * Builds the shared argument list for Vite dev startup across Cellix apps.
 */
export function buildViteArgs(options: BuildViteArgsOptions = {}): string[] {
	const { host = '127.0.0.1', port, env = process.env } = options;
	const args = ['--host', host];

	if (port) {
		args.push('--port', port);
	}

	const viteMode = env['E2E_VITE_MODE'] ?? (isE2E(env) || env['TF_BUILD'] ? 'e2e' : undefined);
	if (viteMode) {
		args.push('--mode', viteMode);
	}

	return args;
}
