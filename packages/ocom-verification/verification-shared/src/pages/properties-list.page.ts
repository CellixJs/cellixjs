import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

/**
 * Page object for the admin properties list screen
 * (`/community/:communityId/admin/:memberId/properties`).
 *
 * Works against both the DOM adapter (component acceptance tests) and the
 * Playwright adapter (browser E2E tests).
 */
export class PropertiesListPage extends AdapterBackedPageObject {
	get heading(): ElementHandle {
		return this.adapter.getByText(/Community Properties \(/);
	}

	get addPropertyButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Add Property/i });
	}

	async clickAddProperty(): Promise<void> {
		await this.addPropertyButton.click();
	}

	/** Property names currently rendered in the table body. */
	async listedPropertyNames(): Promise<string[]> {
		const cells = await this.adapter.locatorAll('.ant-table-tbody tr.ant-table-row td:first-child');
		const names: string[] = [];
		for (const cell of cells) {
			const text = await cell.textContent();
			if (text) {
				names.push(text.trim());
			}
		}
		return names;
	}

	async hasPropertyNamed(propertyName: string): Promise<boolean> {
		const names = await this.listedPropertyNames();
		return names.includes(propertyName);
	}

	/** Full row text for the given property, or undefined when not listed. */
	async rowTextFor(propertyName: string): Promise<string | undefined> {
		const rows = await this.adapter.locatorAll('.ant-table-tbody tr.ant-table-row');
		for (const row of rows) {
			const text = await row.textContent();
			if (text?.includes(propertyName)) {
				return text;
			}
		}
		return undefined;
	}

	/** Cell texts (in column order) for the given property's row, or undefined when not listed. */
	async rowCellsFor(propertyName: string): Promise<string[] | undefined> {
		const rows = await this.adapter.locatorAll('.ant-table-tbody tr.ant-table-row');
		for (const row of rows) {
			const text = await row.textContent();
			if (text?.includes(propertyName)) {
				const cells = await row.querySelectorAll('td');
				const values: string[] = [];
				for (const cell of cells) {
					values.push(((await cell.textContent()) ?? '').trim());
				}
				return values;
			}
		}
		return undefined;
	}

	/** Click the row-level View action for the given property. */
	async clickViewForProperty(propertyName: string): Promise<void> {
		const rows = await this.adapter.locatorAll('.ant-table-tbody tr.ant-table-row');
		for (const row of rows) {
			const text = await row.textContent();
			if (text?.includes(propertyName)) {
				const buttons = await row.querySelectorAll('button, a');
				for (const button of buttons) {
					const label = await button.textContent();
					if (label?.trim() === 'View') {
						await button.click();
						return;
					}
				}
			}
		}
		throw new Error(`No View action found for property "${propertyName}"`);
	}
}
