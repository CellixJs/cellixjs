import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { resolveCommunityBillingPassport } from './resolve-community-actor.ts';

export interface CommunityUpdateSubscriptionTierCommand {
	communityId: string;
	subscriptionTier: string;
	endUserExternalId: string;
}

export const updateSubscriptionTier = (dataSources: DataSources) => {
	return async (command: CommunityUpdateSubscriptionTierCommand): Promise<Domain.Contexts.Community.Community.CommunityEntityReference> => {
		const passport = await resolveCommunityBillingPassport(dataSources, command.communityId, command.endUserExternalId);
		const config = await dataSources.readonlyDataSource.Community.CommunityConfig.CommunityConfigReadRepo.getLatestEffective(command.subscriptionTier);
		if (!config) {
			throw new Error(`No community config found for subscription tier ${command.subscriptionTier}`);
		}

		let communityToReturn: Domain.Contexts.Community.Community.CommunityEntityReference | undefined;
		await dataSources.domainDataSource.Community.Community.CommunityUnitOfWork.withTransaction(passport, async (repo) => {
			const community = await repo.get(command.communityId);
			if (!community) {
				throw new Error(`Community not found for id ${command.communityId}`);
			}
			community.finance.subscriptionTier = command.subscriptionTier;
			communityToReturn = await repo.save(community);
		});
		if (!communityToReturn) {
			throw new Error('community not found');
		}
		return communityToReturn;
	};
};
