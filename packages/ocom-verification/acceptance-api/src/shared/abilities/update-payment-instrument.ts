import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { COMMUNITY_UPDATE_PAYMENT_INSTRUMENT_MUTATION, type CommunityBillingResult, type CommunityMutationPayload } from '../graphql/community-billing-operations.ts';
import { requireSuccessfulCommunityMutation } from './community-billing-result.ts';

export interface PaymentInstrumentInput {
	paymentToken?: string | undefined;
	billingName?: string | undefined;
	billingEmail?: string | undefined;
	billingAddress?: string | undefined;
	billingCity?: string | undefined;
	billingState?: string | undefined;
	billingPostalCode?: string | undefined;
	billingCountry?: string | undefined;
}

interface UpdatePaymentInstrumentDetails {
	communityId: string;
	paymentInstrument: PaymentInstrumentInput;
}

type UpdatePaymentInstrumentHandler = (actor: Actor, details: UpdatePaymentInstrumentDetails) => Promise<CommunityBillingResult>;

export class UpdatePaymentInstrument extends Ability {
	constructor(private readonly handler: UpdatePaymentInstrumentHandler) {
		super();
	}

	static using(handler: UpdatePaymentInstrumentHandler): UpdatePaymentInstrument {
		return new UpdatePaymentInstrument(handler);
	}

	async performAs(actor: Actor, details: UpdatePaymentInstrumentDetails): Promise<CommunityBillingResult> {
		return await this.handler(actor, details);
	}
}

export function updatePaymentInstrumentAbility(): UpdatePaymentInstrument {
	return UpdatePaymentInstrument.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(COMMUNITY_UPDATE_PAYMENT_INSTRUMENT_MUTATION, {
			input: {
				communityId: details.communityId,
				paymentInstrument: details.paymentInstrument,
			},
		});
		return requireSuccessfulCommunityMutation(response.data['communityUpdatePaymentInstrument'] as CommunityMutationPayload | undefined, 'communityUpdatePaymentInstrument');
	});
}
