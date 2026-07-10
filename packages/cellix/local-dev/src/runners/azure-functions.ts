import type { ChildProcess } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { forwardChildExit } from '../process/index.ts';
import { WorktreeSettings } from '../worktree/settings.ts';
import type { WorktreeMode } from '../worktree/types.ts';
import { resolveWorktreeName } from '../worktree/worktree-name.ts';
import { AzureFunctionsLocalSettings, type AzureFunctionsLocalSettingsOptions } from './azure-functions-local-settings.ts';
import { spawnInherited } from './spawn.ts';
import type { EnvRunnerOptions } from './types.ts';

type RunnerEnv = NodeJS.ProcessEnv & {
	NODE_OPTIONS?: string;
	PORT?: string;
	PORTLESS_CA_PATH?: string;
};

export interface AzureFunctionsDevOptions extends EnvRunnerOptions {
	/**
	 * Whether to apply worktree transforms. Defaults to auto-detection from
	 * `WORKTREE_NAME`.
	 */
	worktree?: WorktreeMode;
	/** Worktree name. Defaults to `env.WORKTREE_NAME`. */
	worktreeName?: string;
	/** Functions host port. Defaults to `env.PORT`; required after resolution. */
	port?: string;
	/** Azure Functions script root. Defaults to `deploy/`. */
	scriptRoot?: string;
	/** CORS value passed to the Functions host. Defaults to `*`. */
	cors?: string;
	/** Whether to pass `--typescript`. Defaults to `true`. */
	typescript?: boolean;
	/** Local settings to sync into the script root before starting Functions. */
	localSettings?: AzureFunctionsLocalSettingsOptions;
}

/**
 * Resolves the worktree decision once so the env transform and local-settings
 * sync agree without each layer re-reading the environment.
 *
 * @param options - Worktree mode and name (falling back to the environment).
 * @returns `{ worktree: false }` when transforms are disabled, otherwise
 * `{ worktree: true, worktreeName }`.
 */
function resolveWorktreeContext(options: { env?: NodeJS.ProcessEnv; worktree?: WorktreeMode; worktreeName?: string }): { worktree: boolean; worktreeName?: string } {
	const worktreeName = resolveWorktreeName(options);
	return worktreeName === undefined ? { worktree: false } : { worktree: true, worktreeName };
}

/**
 * Prepares Azure Functions local settings and starts the host with a
 * worktree-aware environment.
 *
 * The runner injects local Portless certificate settings so Functions can call
 * other local HTTPS services during development.
 */
export class AzureFunctionsDevRunner {
	private readonly options: AzureFunctionsDevOptions;

	public constructor(options: AzureFunctionsDevOptions = {}) {
		this.options = options;
	}

	/**
	 * Optionally syncs Functions local settings, then spawns `func start` with
	 * inherited stdio.
	 *
	 * @returns The spawned Functions host process.
	 * @throws When no port is supplied through `options.port` or `env.PORT`.
	 */
	public start(): ChildProcess {
		const worktreeContext = resolveWorktreeContext(this.options);
		const env = new WorktreeSettings({ ...this.options, ...worktreeContext }).toEnv() as RunnerEnv;

		const { localSettings } = this.options;
		if (localSettings) {
			const scriptRoot = localSettings.scriptRoot ?? this.options.scriptRoot;
			new AzureFunctionsLocalSettings({
				...localSettings,
				...worktreeContext,
				env,
				...(scriptRoot ? { scriptRoot } : {}),
			}).sync();
		}

		const envPort = this.options.port ?? env.PORT;
		if (!envPort) {
			throw new Error('[local-dev] PORT environment variable is not set. Start this command through portless.');
		}

		const childEnv: NodeJS.ProcessEnv = {
			...env,
			NODE_EXTRA_CA_CERTS: env.PORTLESS_CA_PATH ?? path.join(os.homedir(), '.portless', 'ca.pem'),
			NODE_OPTIONS: `${env.NODE_OPTIONS ?? ''} --use-system-ca`.trim(),
		};

		const args = ['start'];
		if (this.options.typescript ?? true) {
			args.push('--typescript');
		}
		args.push('--script-root', this.options.scriptRoot ?? 'deploy/', '--port', envPort, '--cors', this.options.cors ?? '*');

		const child = spawnInherited('func', args, {
			env: childEnv,
			...(this.options.spawn ? { spawn: this.options.spawn } : {}),
		});
		forwardChildExit(child);
		return child;
	}
}
