import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

export class MemberCreatePage extends AdapterBackedPageObject {
	get memberNameInput(): ElementHandle {
		return this.adapter.getByLabel('Member Name');
	}

	get createMemberButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Create Member/i });
	}

	get firstValidationError(): ElementHandle {
		return this.adapter.locator('.ant-form-item-explain-error');
	}

	get errorToast(): ElementHandle {
		return this.adapter.locator('.ant-message-error, [role="alert"]');
	}

	async fillMemberName(value: string): Promise<void> {
		await this.memberNameInput.fill(value);
	}

	async clickCreateMember(): Promise<void> {
		await this.createMemberButton.click();
	}
}
