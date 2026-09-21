import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { COMMUNITY_PROCESS_SUBSCRIPTION_CHARGE_MUTATION, type CommunityBillingResult, type CommunityMutationPayload } from '../graphql/community-billing-operations.ts';
import { requireSuccessfulCommunityMutation } from './community-billing-result.ts';

interface ProcessSubscriptionChargeDetails {
	communityId: string;
}

type ProcessSubscriptionChargeHandler = (actor: Actor, details: ProcessSubscriptionChargeDetails) => Promise<CommunityBillingResult>;

export class ProcessSubscriptionCharge extends Ability {
	constructor(private readonly handler: ProcessSubscriptionChargeHandler) {
		super();
	}

	static using(handler: ProcessSubscriptionChargeHandler): ProcessSubscriptionCharge {
		return new ProcessSubscriptionCharge(handler);
	}

	async performAs(actor: Actor, details: ProcessSubscriptionChargeDetails): Promise<CommunityBillingResult> {
		return await this.handler(actor, details);
	}
}

export function processSubscriptionChargeAbility(): ProcessSubscriptionCharge {
	return ProcessSubscriptionCharge.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(COMMUNITY_PROCESS_SUBSCRIPTION_CHARGE_MUTATION, {
			input: {
				communityId: details.communityId,
			},
		});
		return requireSuccessfulCommunityMutation(response.data['communityProcessSubscriptionCharge'] as CommunityMutationPayload | undefined, 'communityProcessSubscriptionCharge');
	});
}
