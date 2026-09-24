import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

/**
 * Page object for the community admin "Settings — General" form.
 *
 * Backed by a {@link PageAdapter} so the DOM acceptance suite and the
 * Playwright E2E suite share the same page contract for the settings screen.
 */
export class CommunitySettingsPage extends AdapterBackedPageObject {
	// antd derives input ids from the Form.Item names, which keeps these
	// locators unambiguous ("Domain" placeholder text is a substring of
	// "White Label Domain", so placeholder lookups would be ambiguous).
	get nameInput(): ElementHandle {
		return this.adapter.locator('#name');
	}

	get whiteLabelDomainInput(): ElementHandle {
		return this.adapter.locator('#whiteLabelDomain');
	}

	get domainInput(): ElementHandle {
		return this.adapter.locator('#domain');
	}

	get handleInput(): ElementHandle {
		return this.adapter.locator('#handle');
	}

	get saveButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Save/i });
	}

	get firstValidationError(): ElementHandle {
		return this.adapter.locator('.ant-form-item-explain-error');
	}

	get errorToast(): ElementHandle {
		return this.adapter.locator('.ant-message-error, [role="alert"]');
	}

	get successToast(): ElementHandle {
		return this.adapter.locator('.ant-message-success');
	}

	async fillName(value: string): Promise<void> {
		await this.nameInput.fill(value);
	}

	async fillWhiteLabelDomain(value: string): Promise<void> {
		await this.whiteLabelDomainInput.fill(value);
	}

	async fillDomain(value: string): Promise<void> {
		await this.domainInput.fill(value);
	}

	async fillHandle(value: string): Promise<void> {
		await this.handleInput.fill(value);
	}

	async clickSave(): Promise<void> {
		await this.saveButton.click();
	}
}
