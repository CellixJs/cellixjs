export interface CommunityUiDetails {
	name?: string;
	plan?: string;
	paymentToken?: string;
	billingName?: string;
	billingEmail?: string;
	billingAddress?: string;
	billingCity?: string;
	billingState?: string;
	billingPostalCode?: string;
	billingCountry?: string;
}

export interface CommunityUiNotes {
	communityName: string;
	formSubmitted: boolean;
	communityCreationQueued: boolean;
	lastBillingError: string;
	baselineTransactionCount: number;
}
