import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

/**
 * Page object for the staff user detail screen.
 *
 * Works against both the DOM adapter (component acceptance tests) and the
 * Playwright adapter (browser E2E tests).
 */
export class StaffUserDetailPage extends AdapterBackedPageObject {
	get heading(): ElementHandle {
		return this.adapter.getByText(/Staff User Details/i);
	}

	get roleSelect(): ElementHandle {
		return this.adapter.locator('.ant-select');
	}

	get currentRoleValue(): ElementHandle {
		return this.adapter.locator('.ant-select-selection-item');
	}

	get saveButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Save/i });
	}

	get activityLogTable(): ElementHandle {
		return this.adapter.locator('.ant-table');
	}

	async roleValueText(): Promise<string> {
		return (await this.currentRoleValue.textContent())?.trim() ?? '';
	}

	async roleSelectDisabled(): Promise<boolean> {
		const disabledAttr = await this.roleSelect.getAttribute('disabled');
		const ariaDisabled = await this.roleSelect.getAttribute('aria-disabled');
		return disabledAttr != null || ariaDisabled === 'true' || ariaDisabled === 'disabled';
	}

	async saveButtonDisabled(): Promise<boolean> {
		const disabledAttr = await this.saveButton.getAttribute('disabled');
		const ariaDisabled = await this.saveButton.getAttribute('aria-disabled');
		return disabledAttr != null || ariaDisabled === 'true' || ariaDisabled === 'disabled';
	}

	async selectRole(roleName: string): Promise<void> {
		await this.roleSelect.click();
		const option = this.adapter.locator(`.ant-select-item-option[title="${roleName}"]`);
		await option.waitFor({ state: 'visible' });
		await option.click();
	}

	async hasActivityLogEntry(entryText: string): Promise<boolean> {
		const text = await this.activityLogTable.textContent();
		return (text ?? '').includes(entryText);
	}
}
