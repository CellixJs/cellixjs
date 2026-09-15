export interface CommunityE2EDetails {
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

export interface CommunityE2ENotes {
	communityId: string | null;
	communityName: string;
	communityCreated: boolean;
	errorMessage: string | null;
	lastBillingError: string | null;
	baselineTransactionCount: number;
}
