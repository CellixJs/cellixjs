import type { DataSources } from '@ocom/persistence';
import { resolveCommunityBillingPassport } from './resolve-community-actor.ts';

export interface CommunityQuerySubscriptionCommand {
	communityId: string;
	endUserExternalId: string;
}

export interface CommunitySubscriptionView {
	tier: string;
	pricePerMember: number;
	currency: string;
	memberCount: number;
	amount: number;
}

export const querySubscription = (dataSources: DataSources) => {
	return async (command: CommunityQuerySubscriptionCommand): Promise<CommunitySubscriptionView | null> => {
		await resolveCommunityBillingPassport(dataSources, command.communityId, command.endUserExternalId);
		const community = await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(command.communityId);
		if (!community) {
			return null;
		}

		const members = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByCommunityId(command.communityId);
		const config = await dataSources.readonlyDataSource.Community.CommunityConfig.CommunityConfigReadRepo.getLatestEffective(community.finance.subscriptionTier);
		// Reporting zero for a missing configuration would show "nothing due" for a
		// community that cannot actually be charged; processSubscriptionCharge throws for
		// this same state, so the read agrees with it.
		if (!config) {
			throw new Error(`No community config found for subscription tier ${community.finance.subscriptionTier}`);
		}
		const pricePerMember = config.subscription.pricePerMember;
		const memberCount = members.length;

		return {
			tier: community.finance.subscriptionTier,
			pricePerMember,
			currency: config.subscription.currency,
			memberCount,
			amount: memberCount * pricePerMember,
		};
	};
};
