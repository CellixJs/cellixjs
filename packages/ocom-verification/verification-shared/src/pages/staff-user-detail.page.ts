import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

/**
 * Page object for the staff user detail screen (`/staff/user-management/users/edit/:id`).
 *
 * Works against both the DOM adapter (component acceptance tests) and the
 * Playwright adapter (browser E2E tests).
 */
export class StaffUserDetailPage extends AdapterBackedPageObject {
	get heading(): ElementHandle {
		return this.adapter.getByText('Staff User Details');
	}

	/** Assigned-role antd Select trigger. */
	get roleSelect(): ElementHandle {
		return this.adapter.getByRole('combobox');
	}

	get saveButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /^Save$/ });
	}

	/**
	 * Role name currently shown by the assigned-role select — the selected
	 * option label when a selection exists, otherwise the placeholder (which
	 * the screen sets to the persisted role name). Handles both the antd v5
	 * (`selection-item`) and antd v6 (`content`) select markup.
	 */
	async displayedRoleName(): Promise<string> {
		const selection = this.adapter.locator('.ant-select-selection-item, .ant-select-content');
		if (await selection.isVisible()) {
			const title = await selection.getAttribute('title');
			if (title) {
				return title;
			}
			const text = (await selection.textContent())?.trim();
			if (text) {
				return text;
			}
		}
		const placeholder = this.adapter.locator('.ant-select-selection-placeholder, .ant-select-placeholder');
		if (await placeholder.isVisible()) {
			return (await placeholder.textContent())?.trim() ?? '';
		}
		return '';
	}

	/** Open the assigned-role dropdown and pick the option with the given role name. */
	async selectRole(roleName: string): Promise<void> {
		await this.roleSelect.click();
		const option = this.adapter.locator(`.ant-select-item-option[title="${roleName}"]`);
		await option.waitFor({ state: 'visible' });
		await option.click();
	}

	async clickSave(): Promise<void> {
		await this.saveButton.click();
	}
}
