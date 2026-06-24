import type { DataTable } from '@cucumber/cucumber';

/**
 * Typed wrapper around a Cucumber `DataTable`.
 */
export class GherkinDataTable {
	/**
	 * @param dataTable Cucumber data table received by a step definition.
	 */
	constructor(private readonly dataTable: DataTable) {}

	/**
	 * Return `rowsHash()` as a caller-provided object shape.
	 *
	 * @typeParam T Shape expected by the step definition.
	 */
	rowsHash<T extends object>(): T {
		return this.dataTable.rowsHash() as T;
	}

	/**
	 * Wrap a Cucumber data table.
	 *
	 * @param dataTable Cucumber data table received by a step definition.
	 */
	static from(dataTable: DataTable): GherkinDataTable {
		return new GherkinDataTable(dataTable);
	}
}
