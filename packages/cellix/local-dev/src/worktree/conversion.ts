import { applyWorktreeSuffix, replaceUrlPort } from '../urls/index.ts';
import { getAzuritePorts, getMongoPort } from './ports.ts';
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
	 * Keys whose Azure Storage connection string value has its `BlobEndpoint`,
	 * `QueueEndpoint`, and `TableEndpoint` ports replaced with worktree-scoped
	 * ports. Values without explicit endpoint segments are left untouched.
	 */
	azuriteKeys?: string[];
}

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

function replaceAzuriteConnectionStringPorts(value: string, worktreeName: string): string {
	const ports = getAzuritePorts(worktreeName);
	return value
		.split(';')
		.map((segment) => {
			if (segment.startsWith('BlobEndpoint=')) {
				return `BlobEndpoint=${replaceUrlPort(segment.slice('BlobEndpoint='.length), ports.blob)}`;
			}
			if (segment.startsWith('QueueEndpoint=')) {
				return `QueueEndpoint=${replaceUrlPort(segment.slice('QueueEndpoint='.length), ports.queue)}`;
			}
			if (segment.startsWith('TableEndpoint=')) {
				return `TableEndpoint=${replaceUrlPort(segment.slice('TableEndpoint='.length), ports.table)}`;
			}
			return segment;
		})
		.join(';');
}

/**
 * Returns a copy of `values` with the worktree conversion applied to exactly the
 * keys named in `plan` — URL hostnames suffixed, Mongo ports shifted, and
 * Azurite endpoint ports replaced with worktree-scoped ports.
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

	for (const key of plan.azuriteKeys ?? []) {
		const value = converted[key];
		if (typeof value === 'string') {
			converted[key] = replaceAzuriteConnectionStringPorts(value, worktreeName);
		}
	}

	return converted;
}
