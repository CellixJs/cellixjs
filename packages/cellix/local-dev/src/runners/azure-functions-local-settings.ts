import path from 'node:path';
import { writeJsonFile } from '../files/json.ts';
import { convertSettingsForWorktree, type WorktreeConversionPlan } from '../worktree/conversion.ts';
import type { SettingsRecord, WorktreeMode } from '../worktree/types.ts';
import { resolveWorktreeName } from '../worktree/worktree-name.ts';

type LocalSettingsEnv = NodeJS.ProcessEnv & {
	E2E?: string;
};

function isE2E(env: NodeJS.ProcessEnv): boolean {
	return ['1', 'true', 'yes'].includes(((env as LocalSettingsEnv).E2E ?? '').toLowerCase());
}

export interface AzureFunctionsLocalSettingsOptions {
	/** App directory used to resolve the default target path. Defaults to `process.cwd()`. */
	appDir?: string;
	/** Functions script root. Defaults to `deploy/`. */
	scriptRoot?: string;
	/** Base environment. Defaults to `process.env`. */
	env?: NodeJS.ProcessEnv;
	/** Whether to apply worktree transforms. Defaults to `env.CELLIX_WORKTREE`, then auto mode. */
	worktree?: WorktreeMode;
	/** Worktree name. Defaults to `env.WORKTREE_NAME`. */
	worktreeName?: string;
	/** Target settings file. Defaults to `<appDir>/<scriptRoot>/local.settings.json`. */
	targetPath?: string;
	/** Functions `Values`, written in every mode. */
	values?: SettingsRecord;
	/** `Values` overrides merged only when `E2E` is truthy. */
	e2eValues?: SettingsRecord;
	/** Functions `Host` block (e.g. `{ LocalHttpPort, CORS }`). */
	host?: SettingsRecord;
	/** Which `Values` keys get worktree-scoped, and how. Applied only in a worktree. */
	worktreeConversion?: WorktreeConversionPlan;
}

/**
 * Generates Azure Functions `local.settings.json` before `func start`.
 *
 * The flow is a flat three steps: load the mode's settings, convert the
 * caller-named keys for the active worktree (a no-op outside a worktree), and
 * write the document the Functions host reads from the script root.
 */
export class AzureFunctionsLocalSettings {
	private readonly options: AzureFunctionsLocalSettingsOptions;

	public constructor(options: AzureFunctionsLocalSettingsOptions = {}) {
		this.options = options;
	}

	/**
	 * Writes the worktree-scoped settings into the Functions script root.
	 */
	public sync(): void {
		const { appDir = process.cwd(), scriptRoot = 'deploy/', env = process.env } = this.options;
		const targetPath = this.options.targetPath ?? path.join(appDir, scriptRoot, 'local.settings.json');
		const worktreeName = resolveWorktreeName({
			env,
			...(typeof this.options.worktree === 'boolean' ? { worktree: this.options.worktree } : {}),
			...(this.options.worktreeName ? { worktreeName: this.options.worktreeName } : {}),
		});

		// 1. LOAD — the settings for this mode (base, plus E2E overrides in E2E).
		const values: SettingsRecord = { ...this.options.values };
		if (isE2E(env) && this.options.e2eValues) {
			Object.assign(values, this.options.e2eValues);
		}

		// 2. CONVERT — scope the caller-named keys to the active worktree (skipped otherwise).
		const converted = worktreeName && this.options.worktreeConversion ? convertSettingsForWorktree(values, worktreeName, this.options.worktreeConversion) : values;

		// 3. WRITE — emit local.settings.json for the Functions host.
		writeJsonFile(targetPath, {
			IsEncrypted: false,
			Values: converted,
			ConnectionStrings: {},
			...(this.options.host ? { Host: this.options.host } : {}),
		});
	}
}
