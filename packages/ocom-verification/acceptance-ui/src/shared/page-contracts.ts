import type { BillingPage, CommunityPage, HomePage } from '@ocom-verification/verification-shared/pages';

export type AcceptanceUiHomePage = Pick<HomePage, 'clickSignIn' | 'signInButton'>;

export type AcceptanceUiCommunityPage = Pick<CommunityPage, 'fillName' | 'selectSubscriptionPlan' | 'fillPaymentInstrument' | 'clickCreate' | 'firstValidationError' | 'errorToast'>;

export type AcceptanceUiBillingPage = Pick<
	BillingPage,
	| 'displayedTier'
	| 'displayedPricePerMemberCents'
	| 'displayedBillingAmountCents'
	| 'displayedMemberCount'
	| 'displayedCurrency'
	| 'displayedPaymentInstrument'
	| 'historyText'
	| 'selectSubscriptionPlan'
	| 'clickSavePlan'
	| 'clickProcessCharge'
	| 'clickUpdatePaymentInstrument'
	| 'firstValidationError'
	| 'errorFeedback'
	| 'processChargeButton'
	| 'paymentInstrumentDisplay'
	| 'billingHistory'
>;
