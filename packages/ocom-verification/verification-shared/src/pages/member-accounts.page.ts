import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

export class MemberAccountsPage extends AdapterBackedPageObject {
	get endUserSelect(): ElementHandle {
		return this.adapter.getByLabel('End User');
	}

	get addMemberAccountButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Add Member Account/i });
	}

	linkedAccountEmail(email: string): ElementHandle {
		return this.adapter.getByText(email);
	}

	async selectEndUser(displayName: string): Promise<void> {
		await this.endUserSelect.click();
		await this.endUserSelect.fill(displayName);
		await this.adapter.getByText(displayName, { selector: '.ant-select-item-option-content' }).click();
	}

	async clickAddMemberAccount(): Promise<void> {
		await this.addMemberAccountButton.click();
	}
}
