export interface BuildViteArgsOptions {
	host?: string;
	port?: string;
	env?: NodeJS.ProcessEnv;
}

type ViteEnv = NodeJS.ProcessEnv & {
	E2E?: string;
	E2E_VITE_MODE?: string;
	TF_BUILD?: string;
};

/**
 * Returns true when the current process is running in an e2e-oriented mode.
 */
export function isE2E(env: NodeJS.ProcessEnv = process.env): boolean {
	const viteEnv = env as ViteEnv;
	return ['1', 'true', 'yes'].includes((viteEnv.E2E ?? '').toLowerCase());
}

/**
 * Builds the shared argument list for Vite dev startup across Cellix apps.
 */
export function buildViteArgs(options: BuildViteArgsOptions = {}): string[] {
	const { host = '127.0.0.1', port, env = process.env } = options;
	const viteEnv = env as ViteEnv;
	const args = ['--host', host];

	if (port) {
		args.push('--port', port);
	}

	const viteMode = viteEnv.E2E_VITE_MODE ?? (isE2E(viteEnv) || viteEnv.TF_BUILD ? 'e2e' : undefined);
	if (viteMode) {
		args.push('--mode', viteMode);
	}

	return args;
}
