import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

/**
 * Page object for the staff users list screen (`/staff/user-management/staff-users`).
 *
 * Works against both the DOM adapter (component acceptance tests) and the
 * Playwright adapter (browser E2E tests).
 */
export class StaffUsersListPage extends AdapterBackedPageObject {
	get heading(): ElementHandle {
		return this.adapter.getByText(/Staff Users \(/);
	}

	get firstRow(): ElementHandle {
		return this.adapter.locator('.ant-table-tbody tr.ant-table-row');
	}

	async listedUserNames(): Promise<string[]> {
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

	async hasUserNamed(userName: string): Promise<boolean> {
		const names = await this.listedUserNames();
		return names.includes(userName);
	}

	async clickRowForUser(userName: string): Promise<void> {
		const rows = await this.adapter.locatorAll('.ant-table-tbody tr.ant-table-row');
		for (const row of rows) {
			const text = await row.textContent();
			if (text?.includes(userName)) {
				const buttons = await row.querySelectorAll('button, a');
				for (const button of buttons) {
					const label = await button.textContent();
					if (label?.trim().toLowerCase() === 'edit') {
						await button.click();
						return;
					}
				}
				await row.click();
				return;
			}
		}
		throw new Error(`No staff user row found for "${userName}"`);
	}
}
