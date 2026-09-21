import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { COMMUNITY_UPDATE_SUBSCRIPTION_TIER_MUTATION, type CommunityBillingResult, type CommunityMutationPayload } from '../graphql/community-billing-operations.ts';
import { requireSuccessfulCommunityMutation } from './community-billing-result.ts';

interface UpdateSubscriptionTierDetails {
	communityId: string;
	subscriptionTier: string;
}

type UpdateSubscriptionTierHandler = (actor: Actor, details: UpdateSubscriptionTierDetails) => Promise<CommunityBillingResult>;

export class UpdateSubscriptionTier extends Ability {
	constructor(private readonly handler: UpdateSubscriptionTierHandler) {
		super();
	}

	static using(handler: UpdateSubscriptionTierHandler): UpdateSubscriptionTier {
		return new UpdateSubscriptionTier(handler);
	}

	async performAs(actor: Actor, details: UpdateSubscriptionTierDetails): Promise<CommunityBillingResult> {
		return await this.handler(actor, details);
	}
}

export function updateSubscriptionTierAbility(): UpdateSubscriptionTier {
	return UpdateSubscriptionTier.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(COMMUNITY_UPDATE_SUBSCRIPTION_TIER_MUTATION, {
			input: {
				communityId: details.communityId,
				subscriptionTier: details.subscriptionTier,
			},
		});
		return requireSuccessfulCommunityMutation(response.data['communityUpdateSubscriptionTier'] as CommunityMutationPayload | undefined, 'communityUpdateSubscriptionTier');
	});
}
