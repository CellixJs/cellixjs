import type { ChildProcess, SpawnOptions } from 'node:child_process';
import type { SettingsRecord } from '../worktree/types.ts';

/**
 * Spawn function used by dev runners.
 *
 * Consumers usually rely on the default `child_process.spawn`; tests and
 * advanced wrappers can inject this to observe or customize process startup.
 */
export type RunnerSpawn = (command: string, args: string[], options: SpawnOptions) => ChildProcess;

/**
 * Common process options shared by local-dev runner objects.
 */
export interface RunnerOptions {
	/** Environment to pass to the spawned process. Defaults to `process.env`. */
	env?: NodeJS.ProcessEnv;
	/** Process spawner used by tests and advanced consumers. Defaults to `child_process.spawn`. */
	spawn?: RunnerSpawn;
}

/**
 * Runner options for processes whose environment is built from caller-provided
 * settings.
 *
 * Settings are merged over `env` and worktree-transformed when a worktree is
 * active (auto-detected from `WORKTREE_NAME`). These runners are invoked only by
 * the `dev:worktree` scripts, so they have no enable/disable toggle: plain `dev`
 * runs the underlying tool directly without a wrapper.
 */
export interface EnvRunnerOptions extends RunnerOptions {
	/** Settings merged over `env` before worktree transforms are applied. */
	settings?: SettingsRecord;
}
