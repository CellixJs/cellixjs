import { normalizeHeaderName } from './internal/normalize-header-name.ts';

/**
 * Merge header records using case-insensitive header names.
 *
 * @param base Default header values.
 * @param incoming Incoming header values.
 * @returns A normalized header record.
 */
export function mergeHeaders(base: Record<string, string>, incoming: Record<string, string>): Record<string, string> {
	const merged: Record<string, string> = {};

	for (const [key, value] of Object.entries(base)) {
		merged[normalizeHeaderName(key)] = value;
	}

	for (const [key, value] of Object.entries(incoming)) {
		merged[normalizeHeaderName(key)] = value;
	}

	return merged;
}
