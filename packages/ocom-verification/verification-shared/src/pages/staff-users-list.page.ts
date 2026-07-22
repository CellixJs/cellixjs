import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

/**
 * Page object for the staff users list screen (`/staff/user-management/users`).
 *
 * Works against both the DOM adapter (component acceptance tests) and the
 * Playwright adapter (browser E2E tests).
 */
export class StaffUsersListPage extends AdapterBackedPageObject {
	get heading(): ElementHandle {
		return this.adapter.getByText(/Staff Users \(/);
	}

	/** Click the row-level Edit action for the staff user with the given display name. */
	async clickEditForUser(displayName: string): Promise<void> {
		const rows = await this.adapter.locatorAll('.ant-table-tbody tr.ant-table-row');
		for (const row of rows) {
			const text = await row.textContent();
			if (text?.includes(displayName)) {
				const buttons = await row.querySelectorAll('button, a');
				for (const button of buttons) {
					const label = await button.textContent();
					if (label?.trim() === 'Edit') {
						await button.click();
						return;
					}
				}
			}
		}
		throw new Error(`No Edit action found for staff user "${displayName}"`);
	}
}
