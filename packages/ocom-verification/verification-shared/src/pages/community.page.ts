import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

export class CommunityPage extends AdapterBackedPageObject {
	get nameInput(): ElementHandle {
		return this.adapter.getByPlaceholder('Name');
	}

	get submitButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Create/i });
	}

	get firstValidationError(): ElementHandle {
		return this.adapter.locator('.ant-form-item-explain-error');
	}

	get errorToast(): ElementHandle {
		return this.adapter.locator('.ant-message-error, [role="alert"]');
	}

	async fillName(value: string): Promise<void> {
		await this.nameInput.fill(value);
	}

	async clickCreate(): Promise<void> {
		await this.submitButton.click();
	}
}
