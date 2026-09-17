import type { BillingPage, CommunityPage, HomePage } from '@ocom-verification/verification-shared/pages';

export type E2EHomePage = Pick<HomePage, 'clickSignIn' | 'signInButton'>;

export type E2ECommunityPage = Pick<CommunityPage, 'fillName' | 'selectSubscriptionPlan' | 'fillPaymentInstrument' | 'clickCreate' | 'firstValidationError' | 'errorToast'>;

export type E2EBillingPage = Pick<
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
