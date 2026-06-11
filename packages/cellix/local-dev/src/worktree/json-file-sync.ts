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
		const env = this.options.env ?? process.env;
		const worktreeName = resolveWorktreeName({ ...this.options, env });

		const values: SettingsRecord = {
			...(document.Values ?? {}),
			...(this.options.values ?? {}),
		};
		const transformedValues = new WorktreeSettings(worktreeName ? { env, worktreeName } : { env, worktree: false }).transformRecord(values) as KnownWorktreeSettings;

		if (worktreeName) {
			this.applyAzuriteConnectionString(transformedValues, worktreeName);
		}

		return {
			...document,
			Values: transformedValues,
		};
	}

	/**
	 * Replaces each configured key with a worktree-scoped Azurite connection
	 * string, when the document carries Azurite account credentials.
	 *
	 * @param values - Transformed settings to mutate in place.
	 * @param worktreeName - Active worktree used to derive Azurite ports.
	 */
	private applyAzuriteConnectionString(values: KnownWorktreeSettings, worktreeName: string): void {
		const accountName = String(values.STORAGE_ACCOUNT_NAME ?? '');
		const accountKey = String(values.STORAGE_ACCOUNT_KEY ?? '');
		if (!accountName || !accountKey) {
			return;
		}

		const connectionString = buildAzuriteConnectionString({
			accountName,
			accountKey,
			ports: getAzuritePorts(worktreeName),
		});
		for (const key of this.options.azuriteConnectionStringKeys ?? []) {
			values[key] = connectionString;
		}
	}
}
