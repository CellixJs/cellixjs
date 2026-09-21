interface MutationStatus {
	success: boolean;
	errorMessage?: string | null;
}

export interface CommunityTransactionResult {
	amount: number;
	transactionReference?: {
		vendor?: string | null;
		isSuccess?: boolean | null;
		lastRequestedAt?: string | null;
		referenceId?: string | null;
		transactionId?: string | null;
		reconciliationId?: string | null;
		completedAt?: string | null;
		errorOccurredAt?: string | null;
		errorCode?: string | null;
		errorMessage?: string | null;
	} | null;
}

interface CommunityFinanceResult {
	subscriptionTier?: string | null;
	paymentInstrumentId?: string | null;
	transactions?: CommunityTransactionResult[] | null;
}

export interface PaymentInstrumentDisplayResult {
	maskedCardNumber?: string | null;
	brand?: string | null;
	expirationMonth?: string | null;
	expirationYear?: string | null;
}

export interface CommunityBillingResult {
	id: string;
	name: string;
	finance?: CommunityFinanceResult | null;
	paymentInstrument?: PaymentInstrumentDisplayResult | null;
}

export interface CommunitySubscriptionResult {
	tier: string;
	pricePerMember: number;
	currency: string;
	memberCount: number;
	amount: number;
}

export interface CommunityMutationPayload {
	status: MutationStatus;
	community?: CommunityBillingResult | null;
}

const COMMUNITY_FINANCE_FIELDS = `
	subscriptionTier
	paymentInstrumentId
	transactions {
		amount
		transactionReference {
			vendor
			isSuccess
			lastRequestedAt
			referenceId
			transactionId
			reconciliationId
			completedAt
			errorOccurredAt
			errorCode
			errorMessage
		}
	}
`;

const PAYMENT_INSTRUMENT_DISPLAY_FIELDS = `
	maskedCardNumber
	brand
	expirationMonth
	expirationYear
`;

export const COMMUNITY_CREATE_WITH_BILLING_MUTATION = `
	mutation CommunityCreateWithBilling($input: CommunityCreateInput!) {
		communityCreate(input: $input) {
			status {
				success
				errorMessage
			}
			community {
				id
				name
				finance {
					${COMMUNITY_FINANCE_FIELDS}
				}
				paymentInstrument {
					${PAYMENT_INSTRUMENT_DISPLAY_FIELDS}
				}
			}
		}
	}
`;

export const COMMUNITY_UPDATE_SUBSCRIPTION_TIER_MUTATION = `
	mutation CommunityUpdateSubscriptionTier($input: CommunityUpdateSubscriptionTierInput!) {
		communityUpdateSubscriptionTier(input: $input) {
			status {
				success
				errorMessage
			}
			community {
				id
				name
				finance {
					${COMMUNITY_FINANCE_FIELDS}
				}
			}
		}
	}
`;

export const COMMUNITY_UPDATE_PAYMENT_INSTRUMENT_MUTATION = `
	mutation CommunityUpdatePaymentInstrument($input: CommunityUpdatePaymentInstrumentInput!) {
		communityUpdatePaymentInstrument(input: $input) {
			status {
				success
				errorMessage
			}
			community {
				id
				name
				finance {
					${COMMUNITY_FINANCE_FIELDS}
				}
				paymentInstrument {
					${PAYMENT_INSTRUMENT_DISPLAY_FIELDS}
				}
			}
		}
	}
`;

export const COMMUNITY_PROCESS_SUBSCRIPTION_CHARGE_MUTATION = `
	mutation CommunityProcessSubscriptionCharge($input: CommunityProcessSubscriptionChargeInput!) {
		communityProcessSubscriptionCharge(input: $input) {
			status {
				success
				errorMessage
			}
			community {
				id
				name
				finance {
					${COMMUNITY_FINANCE_FIELDS}
				}
			}
		}
	}
`;

export const GET_COMMUNITY_BILLING_QUERY = `
	query CommunityBillingById($id: ObjectID!) {
		communityById(id: $id) {
			id
			name
			finance {
				${COMMUNITY_FINANCE_FIELDS}
			}
			paymentInstrument {
				${PAYMENT_INSTRUMENT_DISPLAY_FIELDS}
			}
		}
	}
`;

export const GET_COMMUNITY_SUBSCRIPTION_QUERY = `
	query CommunitySubscription($communityId: ObjectID!) {
		communitySubscription(communityId: $communityId) {
			tier
			pricePerMember
			currency
			memberCount
			amount
		}
	}
`;
