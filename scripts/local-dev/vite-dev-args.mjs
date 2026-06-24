/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {boolean}
 */
export function isE2E(env = process.env) {
	return ['1', 'true', 'yes'].includes((env.E2E ?? '').toLowerCase());
}

/**
 * @param {{ host?: string; port?: string; env?: NodeJS.ProcessEnv }} [options]
 * @returns {string[]}
 */
export function buildViteArgs(options = {}) {
	const { host = '127.0.0.1', port, env = process.env } = options;
	const args = ['--host', host];
	if (port) {
		args.push('--port', port);
	}

	const viteMode = env.E2E_VITE_MODE ?? (isE2E(env) || env.TF_BUILD ? 'e2e' : undefined);
	if (viteMode) {
		args.push('--mode', viteMode);
	}

	return args;
}
