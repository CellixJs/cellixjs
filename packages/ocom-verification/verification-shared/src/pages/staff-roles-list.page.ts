import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

/**
 * Page object for the staff roles list screen (`/staff/user-management/roles`).
 *
 * Works against both the DOM adapter (component acceptance tests) and the
 * Playwright adapter (browser E2E tests).
 */
export class StaffRolesListPage extends AdapterBackedPageObject {
	get heading(): ElementHandle {
		return this.adapter.getByText(/Staff Roles \(/);
	}

	get createRoleButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Create Staff Role/i });
	}

	async clickCreateRole(): Promise<void> {
		await this.createRoleButton.click();
	}

	/** Role names currently rendered in the table body. */
	async listedRoleNames(): Promise<string[]> {
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

	async hasRoleNamed(roleName: string): Promise<boolean> {
		const names = await this.listedRoleNames();
		return names.includes(roleName);
	}

	/** Click the row-level Edit action for the given role. */
	async clickEditForRole(roleName: string): Promise<void> {
		const rows = await this.adapter.locatorAll('.ant-table-tbody tr.ant-table-row');
		for (const row of rows) {
			const text = await row.textContent();
			if (text?.includes(roleName)) {
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
		throw new Error(`No Edit action found for staff role "${roleName}"`);
	}
}
