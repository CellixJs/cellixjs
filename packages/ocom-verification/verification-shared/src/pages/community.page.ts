import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

/**
 * Selects a clickable option in the currently open antd dropdown.
 *
 * Closed dropdowns stay in the DOM but hidden, and antd also renders a zero-size
 * accessibility mirror of the option list, so neither a plain text match nor a
 * `role=option` match reliably resolves to the element that handles the click.
 */
const selectOptionSelector = (label: string): string => `.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option[title="${label}"]`;

export interface CommunityPaymentInstrumentFields {
	paymentToken?: string | undefined;
	billingName?: string | undefined;
	billingEmail?: string | undefined;
	billingAddress?: string | undefined;
	billingCity?: string | undefined;
	billingState?: string | undefined;
	billingPostalCode?: string | undefined;
	billingCountry?: string | undefined;
}

export class CommunityPage extends AdapterBackedPageObject {
	get nameInput(): ElementHandle {
		return this.adapter.getByPlaceholder('Name');
	}

	get subscriptionTierSelect(): ElementHandle {
		return this.adapter.getByLabel('Subscription plan');
	}

	get paymentTokenInput(): ElementHandle {
		return this.adapter.getByLabel('Payment token');
	}

	get billingNameInput(): ElementHandle {
		return this.adapter.getByLabel('Billing name');
	}

	get billingEmailInput(): ElementHandle {
		return this.adapter.getByLabel('Billing email');
	}

	get billingAddressInput(): ElementHandle {
		return this.adapter.getByLabel('Billing address');
	}

	get billingCityInput(): ElementHandle {
		return this.adapter.getByLabel('Billing city');
	}

	get billingStateInput(): ElementHandle {
		return this.adapter.getByLabel('Billing state');
	}

	get billingPostalCodeInput(): ElementHandle {
		return this.adapter.getByLabel('Billing postal code');
	}

	get billingCountryInput(): ElementHandle {
		return this.adapter.getByLabel('Billing country');
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

	async selectSubscriptionPlan(plan: string): Promise<void> {
		await this.subscriptionTierSelect.click();
		await this.adapter.locator(selectOptionSelector(plan)).click();
	}

	async fillPaymentInstrument(fields: CommunityPaymentInstrumentFields): Promise<void> {
		if (fields.paymentToken !== undefined) {
			await this.paymentTokenInput.fill(fields.paymentToken);
		}
		if (fields.billingName !== undefined) {
			await this.billingNameInput.fill(fields.billingName);
		}
		if (fields.billingEmail !== undefined) {
			await this.billingEmailInput.fill(fields.billingEmail);
		}
		if (fields.billingAddress !== undefined) {
			await this.billingAddressInput.fill(fields.billingAddress);
		}
		if (fields.billingCity !== undefined) {
			await this.billingCityInput.fill(fields.billingCity);
		}
		if (fields.billingState !== undefined) {
			await this.billingStateInput.fill(fields.billingState);
		}
		if (fields.billingPostalCode !== undefined) {
			await this.billingPostalCodeInput.fill(fields.billingPostalCode);
		}
		if (fields.billingCountry !== undefined) {
			await this.billingCountryInput.fill(fields.billingCountry);
		}
	}

	async clickCreate(): Promise<void> {
		await this.submitButton.click();
	}
}
