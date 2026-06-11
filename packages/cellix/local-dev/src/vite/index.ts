export interface BuildViteArgsOptions {
	/** Host passed to Vite. Defaults to `127.0.0.1`. */
	host?: string;
	/** Optional port passed to Vite. */
	port?: string;
	/** Environment used to infer e2e mode. Defaults to `process.env`. */
	env?: NodeJS.ProcessEnv;
}

type ViteEnv = NodeJS.ProcessEnv & {
	E2E?: string;
	E2E_VITE_MODE?: string;
	TF_BUILD?: string;
};

/**
 * Returns true when the current process is running in an e2e-oriented mode.
 *
 * @param env - Environment to inspect. Defaults to `process.env`.
 * @returns Whether `E2E` is enabled with a truthy local-dev value.
 */
export function isE2E(env: NodeJS.ProcessEnv = process.env): boolean {
	const viteEnv = env as ViteEnv;
	return ['1', 'true', 'yes'].includes((viteEnv.E2E ?? '').toLowerCase());
}

/**
 * Builds the shared argument list for Vite dev startup across Cellix apps.
 *
 * @param options - Host, port, and env values used to build Vite arguments.
 * @returns CLI arguments suitable for `vite`.
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
