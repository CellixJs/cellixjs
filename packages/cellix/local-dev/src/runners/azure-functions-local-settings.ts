import path from 'node:path';
import { WorktreeJsonFileSync } from '../worktree/json-file-sync.ts';
import type { SettingsRecord, WorktreeMode } from '../worktree/types.ts';

type LocalSettingsEnv = NodeJS.ProcessEnv & {
	E2E?: string;
};

function isE2E(env: NodeJS.ProcessEnv): boolean {
	return ['1', 'true', 'yes'].includes(((env as LocalSettingsEnv).E2E ?? '').toLowerCase());
}

export interface AzureFunctionsLocalSettingsOptions {
	/** App directory containing the source local settings files. Defaults to `process.cwd()`. */
	appDir?: string;
	/** Functions script root. Defaults to `deploy/`. */
	scriptRoot?: string;
	/** Base environment. Defaults to `process.env`. */
	env?: NodeJS.ProcessEnv;
	/** Whether to apply worktree transforms. Defaults to `env.CELLIX_WORKTREE`, then auto mode. */
	worktree?: WorktreeMode;
	/** Worktree name. Defaults to `env.WORKTREE_NAME`. */
	worktreeName?: string;
	/** Source settings file for normal dev mode. Defaults to `<appDir>/local.settings.json`. */
	sourcePath?: string;
	/** Source settings file for E2E mode. Defaults to `<appDir>/local-settings.e2e.json`. */
	e2eSourcePath?: string;
	/** Target settings file. Defaults to `<appDir>/<scriptRoot>/local.settings.json`. */
	targetPath?: string;
	/** Values merged into every mode before worktree transforms. */
	values?: SettingsRecord;
	/** Values merged only when `E2E` is truthy. */
	e2eValues?: SettingsRecord;
	/** Keys that should receive a worktree-scoped Azurite connection string. */
	azuriteConnectionStringKeys?: string[];
}

/**
 * Prepares Azure Functions `local.settings.json` before `func start`.
 *
 * Azure Functions reads `local.settings.json` from the script root. This helper
 * copies the mode-appropriate source file into that location and applies the
 * generic worktree URL, Mongo, and Azurite transforms. Normal dev reads
 * `local.settings.json` when present; E2E mode reads `local-settings.e2e.json`
 * and fails if that source is missing.
 */
export class AzureFunctionsLocalSettings {
	private readonly options: AzureFunctionsLocalSettingsOptions;

	public constructor(options: AzureFunctionsLocalSettingsOptions = {}) {
		this.options = options;
	}

	/**
	 * Syncs the mode-appropriate local settings file into the Functions script
	 * root.
	 *
	 * @throws When E2E mode is active and its source file is missing.
	 */
	public sync(): void {
		const { appDir = process.cwd(), scriptRoot = 'deploy/', env = process.env } = this.options;
		const e2e = isE2E(env);

		new WorktreeJsonFileSync({
			env,
			...(typeof this.options.worktree === 'boolean' ? { worktree: this.options.worktree } : {}),
			...(this.options.worktreeName ? { worktreeName: this.options.worktreeName } : {}),
			sourcePath: e2e ? (this.options.e2eSourcePath ?? path.join(appDir, 'local-settings.e2e.json')) : (this.options.sourcePath ?? path.join(appDir, 'local.settings.json')),
			targetPath: this.options.targetPath ?? path.join(appDir, scriptRoot, 'local.settings.json'),
			skipIfMissing: !e2e,
			values: {
				...(this.options.values ?? {}),
				...(e2e ? (this.options.e2eValues ?? {}) : {}),
			},
			...(this.options.azuriteConnectionStringKeys ? { azuriteConnectionStringKeys: this.options.azuriteConnectionStringKeys } : {}),
		}).sync();
	}
}
