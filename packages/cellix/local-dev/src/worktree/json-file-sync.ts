import { existsSync } from 'node:fs';
import { syncJsonFile } from '../files/json.ts';
import { buildAzuriteConnectionString, getAzuritePorts } from './ports.ts';
import { WorktreeSettings } from './settings.ts';
import type { KnownWorktreeSettings, SettingsDocument, SettingsRecord, WorktreeSettingsOptions } from './types.ts';
import { resolveWorktreeName } from './worktree-name.ts';

export interface WorktreeJsonFileSyncOptions extends WorktreeSettingsOptions {
	/** Source JSON document to copy or transform. */
	sourcePath: string;
	/** Destination path. Parent directories are created automatically. */
	targetPath: string;
	/** Skip syncing when the source file is missing. Defaults to `false`. */
	skipIfMissing?: boolean;
	/** Extra settings merged into the JSON document's `Values` object. */
	values?: SettingsRecord;
	/** Keys that should receive a worktree-scoped Azurite connection string. */
	azuriteConnectionStringKeys?: string[];
}

/**
 * Syncs a JSON settings file while applying generic worktree transforms.
 *
 * The helper is intentionally schema-light: it preserves the source document,
 * merges caller-provided values into `Values`, and only applies generic URL,
 * MongoDB, port, and optional Azurite connection-string transforms.
 */
export class WorktreeJsonFileSync {
	private readonly options: WorktreeJsonFileSyncOptions;

	public constructor(options: WorktreeJsonFileSyncOptions) {
		this.options = options;
	}

	/**
	 * Copies or transforms the configured JSON source into the target path.
	 *
	 * @throws When the source file is missing and `skipIfMissing` is not true.
	 */
	public sync(): void {
		if (this.options.skipIfMissing && !existsSync(this.options.sourcePath)) {
			return;
		}

		syncJsonFile<SettingsDocument>({
			sourcePath: this.options.sourcePath,
			targetPath: this.options.targetPath,
			transform: (document) => this.transformDocument(document),
		});
	}

	private transformDocument(document: SettingsDocument): SettingsDocument {
		const values = {
			...(document.Values ?? {}),
			...(this.options.values ?? {}),
		};
		const env = this.options.env ?? process.env;
		const worktreeName = resolveWorktreeName({
			env,
			...(typeof this.options.worktree === 'boolean' ? { worktree: this.options.worktree } : {}),
			...(this.options.worktreeName ? { worktreeName: this.options.worktreeName } : {}),
		});
		const settings = new WorktreeSettings({
			env,
			...(typeof this.options.worktree === 'boolean' ? { worktree: this.options.worktree } : {}),
			...(worktreeName ? { worktreeName } : {}),
		});
		const transformedValues = settings.transformRecord(values) as KnownWorktreeSettings;
		const accountName = String(transformedValues.STORAGE_ACCOUNT_NAME ?? '');
		const accountKey = String(transformedValues.STORAGE_ACCOUNT_KEY ?? '');

		if (accountName && accountKey && worktreeName) {
			const connectionString = buildAzuriteConnectionString({
				accountName,
				accountKey,
				ports: getAzuritePorts(worktreeName),
			});

			for (const key of this.options.azuriteConnectionStringKeys ?? []) {
				transformedValues[key] = connectionString;
			}
		}

		return {
			...document,
			Values: transformedValues,
		};
	}
}
