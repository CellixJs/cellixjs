import React from 'react';
import { CommunityBilling, type CommunityBillingProps, type CommunityBillingSaveValues, type CommunityBillingTransaction } from '../../../../../../ocom/ui-community-route-admin/src/components/community-billing.tsx';

type BillingTier = 'pro' | 'enterprise';

const CHARGE_FAILURE_TOKEN = 'tok_charge_failure';
const CURRENCY = 'USD';
const PRICE_PER_MEMBER_IN_CENTS: Record<BillingTier, number> = { pro: 1000, enterprise: 2000 };

interface PaymentInstrumentState {
	maskedCardNumber: string;
	brand: string;
	expirationMonth: string;
	expirationYear: string;
}

interface BillingBackendState {
	tier: BillingTier;
	memberCount: number;
	transactions: CommunityBillingTransaction[];
	paymentToken: string | undefined;
	paymentInstrument: PaymentInstrumentState | null;
}

/** Shape of the create-community input the UI submits, as far as billing is concerned. */
export interface BillingCommunityCreateInput {
	subscriptionTier?: string | null | undefined;
	paymentInstrument?: { paymentToken?: string | null | undefined } | null | undefined;
}

const toTier = (plan?: string | null): BillingTier => ((plan ?? '').trim().toLowerCase() === 'enterprise' ? 'enterprise' : 'pro');

const instrumentFor = (paymentToken: string): PaymentInstrumentState => ({
	maskedCardNumber: `XXXX-XXXX-XXXX-${paymentToken === CHARGE_FAILURE_TOKEN ? '0002' : '1111'}`,
	brand: paymentToken.includes('mastercard') ? 'mastercard' : 'visa',
	expirationMonth: '12',
	expirationYear: '2030',
});

const emptyState = (): BillingBackendState => ({
	tier: 'pro',
	memberCount: 1,
	transactions: [],
	paymentToken: undefined,
	paymentInstrument: null,
});

let state: BillingBackendState = emptyState();
const listeners = new Set<() => void>();

const emit = (): void => {
	for (const listener of listeners) {
		listener();
	}
};

const currentAmount = (): number => state.memberCount * PRICE_PER_MEMBER_IN_CENTS[state.tier];

const appendCharge = (): void => {
	state.transactions = [
		...state.transactions,
		{
			id: `txn-${state.transactions.length + 1}`,
			amount: currentAmount(),
			isSuccess: state.paymentToken !== CHARGE_FAILURE_TOKEN,
		},
	];
};

/** Clears any billing state left over from a previous scenario. */
export const resetBillingBackend = (): void => {
	state = emptyState();
	emit();
};

/** Seeds billing state from the community the actor just created through the UI. */
export const initializeBillingBackend = (input: BillingCommunityCreateInput): void => {
	const paymentToken = input.paymentInstrument?.paymentToken?.trim();
	state = {
		tier: toTier(input.subscriptionTier),
		memberCount: 1,
		transactions: [],
		paymentToken: paymentToken || undefined,
		paymentInstrument: paymentToken ? instrumentFor(paymentToken) : null,
	};
	if (paymentToken) {
		appendCharge();
	}
	emit();
};

const handleSave = (values: CommunityBillingSaveValues): Promise<void> => {
	if (values.subscriptionTier) {
		state.tier = toTier(values.subscriptionTier);
	}
	const paymentToken = values.paymentInstrument?.paymentToken?.trim();
	if (paymentToken) {
		state.paymentToken = paymentToken;
		state.paymentInstrument = instrumentFor(paymentToken);
	}
	emit();
	return Promise.resolve();
};

const handleProcessCharge = (): Promise<void> => {
	if (!state.paymentInstrument) {
		return Promise.reject(new Error('A payment instrument is required before processing a subscription charge.'));
	}
	appendCharge();
	emit();
	return Promise.resolve();
};

const BillingHarness: React.FC = () => {
	const [, setVersion] = React.useState(0);

	React.useEffect(() => {
		const listener = () => {
			setVersion((version) => version + 1);
		};
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}, []);

	const props: CommunityBillingProps = {
		subscriptionTier: state.tier,
		pricePerMember: PRICE_PER_MEMBER_IN_CENTS[state.tier],
		currency: CURRENCY,
		memberCount: state.memberCount,
		amount: currentAmount(),
		transactions: state.transactions,
		paymentInstrument: state.paymentInstrument,
		onSave: handleSave,
		onProcessCharge: handleProcessCharge,
	};

	return React.createElement(CommunityBilling, props);
};

/** Element rendering the real billing screen against the in-memory billing backend. */
export const createBillingHarnessElement = (): React.ReactElement => React.createElement(BillingHarness);
