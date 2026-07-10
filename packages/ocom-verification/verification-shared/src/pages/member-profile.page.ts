import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

export class MemberProfilePage extends AdapterBackedPageObject {
	get displayNameInput(): ElementHandle {
		return this.adapter.getByPlaceholder('Display Name');
	}

	get emailInput(): ElementHandle {
		return this.adapter.getByPlaceholder('Email');
	}

	get bioInput(): ElementHandle {
		return this.adapter.getByPlaceholder('Bio');
	}

	get editProfileButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Edit Profile/i });
	}

	get saveProfileButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Save Profile/i });
	}

	get firstValidationError(): ElementHandle {
		return this.adapter.locator('.ant-form-item-explain-error');
	}

	get errorToast(): ElementHandle {
		return this.adapter.locator('.ant-message-error, [role="alert"]');
	}

	async clickEditProfile(): Promise<void> {
		await this.editProfileButton.click();
	}

	async clickSaveProfile(): Promise<void> {
		await this.saveProfileButton.click();
	}

	async fillDisplayName(value: string): Promise<void> {
		await this.displayNameInput.fill(value);
	}

	async fillEmail(value: string): Promise<void> {
		await this.emailInput.fill(value);
	}

	async fillBio(value: string): Promise<void> {
		await this.bioInput.fill(value);
	}

	async setShowInterests(value: boolean): Promise<void> {
		await this.setSwitchAtIndex(0, value);
	}

	async setShowEmail(value: boolean): Promise<void> {
		await this.setSwitchAtIndex(1, value);
	}

	async setShowProfile(value: boolean): Promise<void> {
		await this.setSwitchAtIndex(2, value);
	}

	async setShowLocation(value: boolean): Promise<void> {
		await this.setSwitchAtIndex(3, value);
	}

	async setShowProperties(value: boolean): Promise<void> {
		await this.setSwitchAtIndex(4, value);
	}

	private async setSwitchAtIndex(index: number, expectedChecked: boolean): Promise<void> {
		const switches = await this.adapter.locatorAll('button[role="switch"]');
		const target = switches[index];
		if (!target) {
			throw new Error(`Expected switch at index ${index} but none was found`);
		}

		const checkedState = await target.getAttribute('aria-checked');
		const isChecked = checkedState === 'true';
		if (isChecked !== expectedChecked) {
			await target.click();
		}
	}
}
