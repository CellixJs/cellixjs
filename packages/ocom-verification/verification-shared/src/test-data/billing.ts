/** Mock payment token that should succeed when charging. */
export const DEFAULT_TEST_PAYMENT_TOKEN = 'tok_visa';

/** Sentinel mock payment token that should fail a charge. */
export const CHARGE_FAILURE_PAYMENT_TOKEN = 'tok_charge_failure';

/** Default billing fields used when a scenario only specifies a plan. */
export const DEFAULT_TEST_PAYMENT_INSTRUMENT = {
	paymentToken: DEFAULT_TEST_PAYMENT_TOKEN,
	billingName: 'Alice Owner',
	billingEmail: 'owner@test.example',
	billingAddress: '1 Main Street',
	billingCity: 'Portland',
	billingState: 'OR',
	billingPostalCode: '97201',
	billingCountry: 'US',
} as const;

/** Gherkin create/update fields that indicate billing input was supplied. */
export interface BillingInputFields {
	plan?: string | undefined;
	paymentToken?: string | undefined;
	billingName?: string | undefined;
	billingEmail?: string | undefined;
	billingAddress?: string | undefined;
	billingCity?: string | undefined;
	billingState?: string | undefined;
	billingPostalCode?: string | undefined;
	billingCountry?: string | undefined;
}

export function hasBillingInput(details: BillingInputFields): boolean {
	return (
		details.plan !== undefined ||
		details.paymentToken !== undefined ||
		details.billingName !== undefined ||
		details.billingEmail !== undefined ||
		details.billingAddress !== undefined ||
		details.billingCity !== undefined ||
		details.billingState !== undefined ||
		details.billingPostalCode !== undefined ||
		details.billingCountry !== undefined
	);
}

export function toSubscriptionTier(plan?: string): 'pro' | 'enterprise' | undefined {
	if (!plan) {
		return undefined;
	}
	const normalized = plan.trim().toLowerCase();
	if (normalized === 'pro' || normalized === 'enterprise') {
		return normalized;
	}
	throw new Error(`Unknown subscription plan "${plan}". Expected Pro or Enterprise.`);
}

export function toDisplayTier(tier?: string | null): string {
	const normalized = (tier ?? '').trim().toLowerCase();
	if (normalized === 'pro') {
		return 'Pro';
	}
	if (normalized === 'enterprise') {
		return 'Enterprise';
	}
	return (tier ?? '').trim();
}
