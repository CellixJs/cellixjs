import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

/**
 * Selects a clickable option in the currently open antd dropdown.
 *
 * Closed dropdowns stay in the DOM but hidden, and antd also renders a zero-size
 * accessibility mirror of the option list, so neither a plain text match nor a
 * `role=option` match reliably resolves to the element that handles the click.
 */
const selectOptionSelector = (label: string): string => `.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option[title="${label}"]`;

const CENTS_ONLY = /^\d+$/;
const DOLLAR_AMOUNT = /\$(\d+(?:\.\d{1,2})?)/;
const DECIMAL_AMOUNT = /(\d+\.\d{2})/;

export function parseMoneyToCents(text: string | null | undefined): number | undefined {
	const value = (text ?? '').replace(/,/g, '').trim();
	if (!value) {
		return undefined;
	}
	if (CENTS_ONLY.test(value)) {
		return Number(value);
	}
	const dollarMatch = value.match(DOLLAR_AMOUNT);
	if (dollarMatch?.[1]) {
		return Math.round(Number(dollarMatch[1]) * 100);
	}
	const decimalMatch = value.match(DECIMAL_AMOUNT);
	if (decimalMatch?.[1] && /usd|amount|price|total/i.test(value)) {
		return Math.round(Number(decimalMatch[1]) * 100);
	}
	const integerMatch = value.match(/(\d+)/);
	return integerMatch?.[1] ? Number(integerMatch[1]) : undefined;
}

export class BillingPage extends AdapterBackedPageObject {
	get subscriptionTier(): ElementHandle {
		return this.adapter.locator('[data-testid="community-subscription-tier"]');
	}

	get pricePerMember(): ElementHandle {
		return this.adapter.locator('[data-testid="community-price-per-member"]');
	}

	get billingAmount(): ElementHandle {
		return this.adapter.locator('[data-testid="community-billing-amount"]');
	}

	get billedMemberCount(): ElementHandle {
		return this.adapter.locator('[data-testid="community-billed-member-count"]');
	}

	get billingCurrency(): ElementHandle {
		return this.adapter.locator('[data-testid="community-billing-currency"]');
	}

	get billingHistory(): ElementHandle {
		return this.adapter.locator('[data-testid="billing-history"]');
	}

	get paymentInstrumentDisplay(): ElementHandle {
		return this.adapter.locator('[data-testid="payment-instrument-display"]');
	}

	get processChargeButton(): ElementHandle {
		return this.adapter.locator('[data-testid="process-subscription-charge"]');
	}

	get subscriptionTierSelect(): ElementHandle {
		return this.adapter.getByLabel('Subscription plan');
	}

	get updatePaymentInstrumentButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Update payment instrument|Update card|Change card/i });
	}

	get savePlanButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Save plan|Update plan|Change plan/i });
	}

	get firstValidationError(): ElementHandle {
		return this.adapter.locator('.ant-form-item-explain-error');
	}

	get errorFeedback(): ElementHandle {
		return this.adapter.locator('.ant-message-error, [role="alert"]');
	}

	async displayedTier(): Promise<string> {
		return ((await this.subscriptionTier.textContent()) ?? '').trim();
	}

	async displayedPricePerMemberCents(): Promise<number | undefined> {
		return parseMoneyToCents(await this.pricePerMember.textContent());
	}

	async displayedBillingAmountCents(): Promise<number | undefined> {
		return parseMoneyToCents(await this.billingAmount.textContent());
	}

	async displayedMemberCount(): Promise<number | undefined> {
		const text = ((await this.billedMemberCount.textContent()) ?? '').trim();
		if (!text) {
			return undefined;
		}
		const match = text.match(/\d+/);
		return match ? Number(match[0]) : undefined;
	}

	async displayedCurrency(): Promise<string> {
		return ((await this.billingCurrency.textContent()) ?? '').trim();
	}

	async displayedPaymentInstrument(): Promise<string> {
		return ((await this.paymentInstrumentDisplay.textContent()) ?? '').trim();
	}

	async historyText(): Promise<string> {
		return ((await this.billingHistory.textContent()) ?? '').trim();
	}

	async selectSubscriptionPlan(plan: string): Promise<void> {
		await this.subscriptionTierSelect.click();
		await this.adapter.locator(selectOptionSelector(plan)).click();
	}

	async clickSavePlan(): Promise<void> {
		await this.savePlanButton.click();
	}

	async clickProcessCharge(): Promise<void> {
		await this.processChargeButton.click();
	}

	async clickUpdatePaymentInstrument(): Promise<void> {
		await this.updatePaymentInstrumentButton.click();
	}
}
