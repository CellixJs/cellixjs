import type { ChildProcess } from 'node:child_process';
import { forwardChildExit } from '../process/index.ts';
import { spawnInherited } from './spawn.ts';
import type { RunnerOptions } from './types.ts';

type RunnerEnv = NodeJS.ProcessEnv & {
	PORT?: string;
};

/**
 * Starts the Docusaurus dev server with the shared local-dev defaults.
 *
 * The server binds to `127.0.0.1`, uses `env.PORT` or `3001`, and does not
 * auto-open a browser.
 */
export class DocusaurusDevRunner {
	private readonly options: RunnerOptions;

	public constructor(options: RunnerOptions = {}) {
		this.options = options;
	}

	/**
	 * Spawns the Docusaurus dev server with inherited stdio.
	 *
	 * @returns The spawned child process.
	 */
	public start(): ChildProcess {
		const env = (this.options.env ?? process.env) as RunnerEnv;
		const child = spawnInherited('docusaurus', ['start', '--port', env.PORT ?? '3001', '--host', '127.0.0.1', '--no-open'], {
			env,
			...(this.options.spawn ? { spawn: this.options.spawn } : {}),
		});
		forwardChildExit(child);
		return child;
	}
}

/**
 * Starts the Docusaurus dev server.
 *
 * @param options - Optional env and spawn override.
 * @returns The spawned child process.
 */
export function runDocusaurusDev(options: RunnerOptions = {}): ChildProcess {
	return new DocusaurusDevRunner(options).start();
}
