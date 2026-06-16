import { applyWorktreeSuffix, replaceUrlPort } from '../urls/index.ts';
import { buildAzuriteConnectionString, getAzuritePorts, getMongoPort } from './ports.ts';
import type { SettingsRecord } from './types.ts';

/**
 * Explicit description of which settings change for a worktree, and how.
 *
 * The caller names the keys; this package only knows the mechanics. Keys not
 * listed here are passed through untouched.
 */
export interface WorktreeConversionPlan {
	/** Keys whose `http(s)` URL value gets the worktree hostname suffix. */
	urlKeys?: string[];
	/** Keys whose `mongodb://` URL value gets the worktree Mongo port. */
	mongoKeys?: string[];
	/**
	 * Keys that receive a worktree-scoped Azurite connection string, built from
	 * the same settings record's `STORAGE_ACCOUNT_NAME` and
	 * `STORAGE_ACCOUNT_KEY` values. When either credential is missing, these keys
	 * are left untouched.
	 */
	azuriteKeys?: string[];
}

/**
 * Suffixes a URL's hostname with the worktree label, preserving the rest of the
 * URL (path, query, and absence of a trailing slash).
 */
function suffixUrlHostname(value: string, worktreeName: string): string {
	try {
		const url = new URL(value);
		url.hostname = applyWorktreeSuffix(url.hostname, worktreeName);
		const result = url.toString();
		// `URL.toString()` appends a trailing slash to bare-origin URLs; keep input shape.
		if (!value.endsWith('/') && url.pathname === '/' && !url.search && !url.hash) {
			return result.slice(0, -1);
		}
		return result;
	} catch {
		return value;
	}
}

function buildWorktreeAzuriteConnectionString(values: SettingsRecord, worktreeName: string): string | undefined {
	// biome-ignore lint/complexity/useLiteralKeys: noPropertyAccessFromIndexSignature requires bracket notation
	const accountName = String(values['STORAGE_ACCOUNT_NAME'] ?? '');
	// biome-ignore lint/complexity/useLiteralKeys: noPropertyAccessFromIndexSignature requires bracket notation
	const accountKey = String(values['STORAGE_ACCOUNT_KEY'] ?? '');
	if (!accountName || !accountKey) {
		return undefined;
	}

	return buildAzuriteConnectionString({
		accountName,
		accountKey,
		ports: getAzuritePorts(worktreeName),
	});
}

/**
 * Returns a copy of `values` with the worktree conversion applied to exactly the
 * keys named in `plan` — URL hostnames suffixed, Mongo ports shifted, and
 * Azurite storage keys replaced with a worktree-scoped connection string.
 *
 * @param values - Settings to convert (not mutated).
 * @param worktreeName - Active worktree label.
 * @param plan - Which keys change and how.
 * @returns A converted copy of `values`.
 */
export function convertSettingsForWorktree(values: SettingsRecord, worktreeName: string, plan: WorktreeConversionPlan): SettingsRecord {
	const converted: SettingsRecord = { ...values };

	for (const key of plan.urlKeys ?? []) {
		const value = converted[key];
		if (typeof value === 'string') {
			converted[key] = suffixUrlHostname(value, worktreeName);
		}
	}

	for (const key of plan.mongoKeys ?? []) {
		const value = converted[key];
		if (typeof value === 'string') {
			converted[key] = replaceUrlPort(value, getMongoPort(worktreeName));
		}
	}

	if (plan.azuriteKeys?.length) {
		const connectionString = buildWorktreeAzuriteConnectionString(converted, worktreeName);
		if (connectionString) {
			for (const key of plan.azuriteKeys) {
				converted[key] = connectionString;
			}
		}
	}

	return converted;
}
