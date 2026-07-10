import type { ChildProcess } from 'node:child_process';
import { forwardChildExit } from '../process/index.ts';
import { buildViteArgs } from '../vite/index.ts';
import { WorktreeSettings } from '../worktree/settings.ts';
import { spawnInherited } from './spawn.ts';
import type { EnvRunnerOptions } from './types.ts';

export type ViteDevOptions = EnvRunnerOptions;

/**
 * Starts a Vite dev process using the caller-provided environment.
 *
 * @example
 * ```ts
 * new ViteDevRunner({ env }).start();
 * ```
 */
export class ViteDevRunner {
	private readonly options: ViteDevOptions;

	public constructor(options: ViteDevOptions = {}) {
		this.options = options;
	}

	/**
	 * Spawns Vite with host, port, and mode derived from the supplied env.
	 *
	 * @returns The spawned Vite child process.
	 */
	public start(): ChildProcess {
		const env = new WorktreeSettings(this.options).toEnv();
		const { HOST: host, PORT: port } = env;
		const child = spawnInherited(
			'vite',
			buildViteArgs({
				...(host ? { host } : {}),
				...(port ? { port } : {}),
				env,
			}),
			{
				env,
				...(this.options.spawn ? { spawn: this.options.spawn } : {}),
			},
		);
		forwardChildExit(child);
		return child;
	}
}
