import path from 'node:path';
import { isE2E } from '../env/index.ts';
import { writeJsonFile } from '../files/json.ts';
import { convertSettingsForWorktree, type WorktreeConversionPlan } from '../worktree/conversion.ts';
import type { SettingsRecord, WorktreeMode } from '../worktree/types.ts';
import { resolveWorktreeName } from '../worktree/worktree-name.ts';

function resolveTargetPath(options: AzureFunctionsLocalSettingsOptions): string {
	const { appDir = process.cwd(), scriptRoot = 'deploy/' } = options;
	return options.targetPath ?? path.join(appDir, scriptRoot, 'local.settings.json');
}

function resolveSettingsWorktreeName(options: AzureFunctionsLocalSettingsOptions, env: NodeJS.ProcessEnv): string | undefined {
	return resolveWorktreeName({
		env,
		...(typeof options.worktree === 'boolean' ? { worktree: options.worktree } : {}),
		...(options.worktreeName ? { worktreeName: options.worktreeName } : {}),
	});
}

function buildModeValues(options: AzureFunctionsLocalSettingsOptions, env: NodeJS.ProcessEnv): SettingsRecord {
	const values: SettingsRecord = { ...options.values };
	if (isE2E(env) && options.e2eValues) {
		Object.assign(values, options.e2eValues);
	}
	return values;
}

function applyWorktreeConversion(values: SettingsRecord, worktreeName: string | undefined, plan: WorktreeConversionPlan | undefined): SettingsRecord {
	return worktreeName && plan ? convertSettingsForWorktree(values, worktreeName, plan) : values;
}

export interface AzureFunctionsLocalSettingsOptions {
	/** App directory used to resolve the default target path. Defaults to `process.cwd()`. */
	appDir?: string;
	/** Functions script root. Defaults to `deploy/`. */
	scriptRoot?: string;
	/** Base environment. Defaults to `process.env`. */
	env?: NodeJS.ProcessEnv;
	/** Whether to apply worktree transforms. Defaults to auto-detection from `WORKTREE_NAME`. */
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
 * Resolves the mode-appropriate `Values` for the API's local settings,
 * worktree-scoped the same way {@link AzureFunctionsLocalSettings.sync} scopes
 * them before writing `local.settings.json`.
 *
 * Centralizes the worktree-conversion mechanics here so callers that need
 * these values for something other than the Functions host's own
 * `local.settings.json` (e.g. an E2E test process reading the API's mock
 * service endpoints directly) get the same worktree-scoped values without
 * reimplementing the conversion themselves.
 *
 * @param options - Same options accepted by {@link AzureFunctionsLocalSettings}.
 * @returns The resolved values, converted only when a worktree is active.
 *
 * @example
 * ```ts
 * const values = resolveAzureFunctionsLocalSettingsValues({
 *   env: { WORKTREE_NAME: 'feature-a' },
 *   values: { DATABASE_URL: 'mongodb://127.0.0.1:50000/app' },
 *   worktreeConversion: { mongoKeys: ['DATABASE_URL'] },
 * });
 * ```
 */
export function resolveAzureFunctionsLocalSettingsValues(options: AzureFunctionsLocalSettingsOptions = {}): SettingsRecord {
	const env = options.env ?? process.env;
	const worktreeName = resolveSettingsWorktreeName(options, env);
	const values = buildModeValues(options, env);

	return applyWorktreeConversion(values, worktreeName, options.worktreeConversion);
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
		const targetPath = resolveTargetPath(this.options);
		const values = resolveAzureFunctionsLocalSettingsValues(this.options);

		writeJsonFile(targetPath, {
			IsEncrypted: false,
			Values: values,
			ConnectionStrings: {},
			...(this.options.host ? { Host: this.options.host } : {}),
		});
	}
}
