import type { ChildProcess } from 'node:child_process';
import { forwardChildExit } from '../process/index.ts';
import { WorktreeSettings } from '../worktree/settings.ts';
import { spawnInherited } from './spawn.ts';
import type { EnvRunnerOptions } from './types.ts';

export interface NodeDevOptions extends EnvRunnerOptions {
	/** Node entrypoint to execute. Defaults to `src/index.ts`. */
	entry?: string;
	/** Additional Node CLI arguments passed before the entrypoint. */
	nodeArgs?: string[];
}

/**
 * Starts a Node-backed dev process. On the supported workspace Node version,
 * this can execute TypeScript entrypoints without the TSX runtime.
 *
 * @example
 * ```ts
 * new NodeDevRunner({ env, entry: 'src/index.ts' }).start();
 * ```
 */
export class NodeDevRunner {
	private readonly options: NodeDevOptions;

	public constructor(options: NodeDevOptions = {}) {
		this.options = options;
	}

	/**
	 * Spawns the configured Node process with inherited stdio.
	 *
	 * @returns The spawned child process.
	 */
	public start(): ChildProcess {
		const env = new WorktreeSettings(this.options).toEnv();
		const child = spawnInherited('node', [...(this.options.nodeArgs ?? []), this.options.entry ?? 'src/index.ts'], {
			env,
			...(this.options.spawn ? { spawn: this.options.spawn } : {}),
		});
		forwardChildExit(child);
		return child;
	}
}

/**
 * Starts a Node-backed dev process.
 *
 * @param options - Optional entrypoint, Node arguments, env, and spawn
 * override.
 * @returns The spawned child process.
 */
export function runNodeDev(options: NodeDevOptions = {}): ChildProcess {
	return new NodeDevRunner(options).start();
}

/**
 * @deprecated Use `NodeDevRunner` or `runNodeDev`. TSX is no longer required
 * for local dev entrypoints on the supported Node runtime.
 */
export type TsxRunnerOptions = NodeDevOptions;

/**
 * @deprecated Use `runNodeDev`.
 *
 * @param options - Node dev options preserved for compatibility.
 * @returns The spawned child process.
 */
export function runTsxDev(options: TsxRunnerOptions = {}): ChildProcess {
	return runNodeDev(options);
}
