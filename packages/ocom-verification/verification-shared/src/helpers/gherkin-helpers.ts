import type { DataTable } from '@cucumber/cucumber';

/**
 * Returns a DataTable's rowsHash typed as the caller-provided shape so consumers
 * can access keys directly (e.g. `row.name`) without tripping
 * TypeScript's `noPropertyAccessFromIndexSignature` rule.
 */
export function typedRowsHash<T extends object>(dataTable: DataTable): T {
	return dataTable.rowsHash() as T;
}
