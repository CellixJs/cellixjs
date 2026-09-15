import type { DataSources } from '@ocom/persistence';

export interface CommunityQuerySubscriptionCommand {
	communityId: string;
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
		const community = await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(command.communityId);
		if (!community) {
			return null;
		}

		const members = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByCommunityId(command.communityId);
		const config = await dataSources.readonlyDataSource.Community.CommunityConfig.CommunityConfigReadRepo.getLatestEffective(community.finance.subscriptionTier);
		const pricePerMember = config?.subscription.pricePerMember ?? 0;
		const memberCount = members.length;

		return {
			tier: community.finance.subscriptionTier,
			pricePerMember,
			currency: config?.subscription.currency ?? 'USD',
			memberCount,
			amount: memberCount * pricePerMember,
		};
	};
};
