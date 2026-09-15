export interface CommunityDetails {
	name: string;
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

export interface CommunityNotes {
	lastCommunityStatus: string;
	lastCommunityName: string;
	lastCommunityId: string;
	lastValidationError: string;
	lastBillingError: string;
	lastBillingStatus: string;
	baselineTransactionCount: number;
}
