import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

/**
 * Page object for the admin property create and detail/edit forms.
 *
 * Works against both the DOM adapter (component acceptance tests) and the
 * Playwright adapter (browser E2E tests).
 */
export class PropertyFormPage extends AdapterBackedPageObject {
	get propertyNameInput(): ElementHandle {
		return this.adapter.getByLabel('Property Name');
	}

	get propertyTypeInput(): ElementHandle {
		return this.adapter.getByLabel('Property Type');
	}

	get bedroomsInput(): ElementHandle {
		return this.adapter.getByLabel('Bedrooms');
	}

	get bathroomsInput(): ElementHandle {
		return this.adapter.getByLabel('Bathrooms');
	}

	get squareFeetInput(): ElementHandle {
		return this.adapter.getByLabel('Square Feet');
	}

	get createButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Create Property/i });
	}

	get saveButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /^Save$/i });
	}

	get removePropertyButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Remove Property/i });
	}

	get removeConfirmationTitle(): ElementHandle {
		return this.adapter.getByText('Remove this property?');
	}

	/** Confirmation (ok) button inside the removal confirmation modal. */
	get confirmRemoveButton(): ElementHandle {
		return this.adapter.locator('.ant-modal .ant-modal-footer button.ant-btn-primary');
	}

	get firstValidationError(): ElementHandle {
		return this.adapter.locator('.ant-form-item-explain-error');
	}

	get errorFeedback(): ElementHandle {
		return this.adapter.locator('.ant-message-error, [role="alert"]');
	}

	get successFeedback(): ElementHandle {
		return this.adapter.locator('.ant-message-success');
	}

	get notFoundResult(): ElementHandle {
		return this.adapter.getByText('Property Not Found');
	}

	async fillPropertyName(value: string): Promise<void> {
		await this.propertyNameInput.fill(value);
	}

	async fillPropertyType(value: string): Promise<void> {
		await this.propertyTypeInput.fill(value);
	}

	async fillBedrooms(value: number): Promise<void> {
		await this.bedroomsInput.fill(String(value));
	}

	async fillBathrooms(value: number): Promise<void> {
		await this.bathroomsInput.fill(String(value));
	}

	async fillSquareFeet(value: number): Promise<void> {
		await this.squareFeetInput.fill(String(value));
	}

	/** Current value of the property name input. */
	async propertyNameValue(): Promise<string> {
		return (await this.propertyNameInput.inputValue()) ?? '';
	}

	/** Current value of the property type input. */
	async propertyTypeValue(): Promise<string> {
		return (await this.propertyTypeInput.inputValue()) ?? '';
	}

	/** Current value of the bedrooms input. */
	async bedroomsValue(): Promise<string> {
		return (await this.bedroomsInput.inputValue()) ?? '';
	}

	/** Current value of the bathrooms input. */
	async bathroomsValue(): Promise<string> {
		return (await this.bathroomsInput.inputValue()) ?? '';
	}

	/** Current value of the square feet input. */
	async squareFeetValue(): Promise<string> {
		return (await this.squareFeetInput.inputValue()) ?? '';
	}

	async clickCreate(): Promise<void> {
		await this.createButton.click();
	}

	async clickSave(): Promise<void> {
		await this.saveButton.click();
	}

	async clickRemoveProperty(): Promise<void> {
		await this.removePropertyButton.click();
	}

	async clickConfirmRemove(): Promise<void> {
		await this.confirmRemoveButton.click();
	}
}
