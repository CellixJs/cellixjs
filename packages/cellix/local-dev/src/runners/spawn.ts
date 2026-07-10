import { type ChildProcess, spawn } from 'node:child_process';
import type { RunnerOptions } from './types.ts';

/**
 * Spawns a command with inherited stdio and the caller-provided environment.
 *
 * @param command - Executable name.
 * @param args - Command-line arguments.
 * @param options - Optional env and spawn override.
 * @returns The spawned child process.
 */
export function spawnInherited(command: string, args: string[], options: RunnerOptions = {}): ChildProcess {
	return (options.spawn ?? spawn)(command, args, {
		stdio: 'inherit',
		env: options.env,
	});
}
