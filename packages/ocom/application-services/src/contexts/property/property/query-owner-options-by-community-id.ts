import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { ensureCommunityPropertiesViewable } from './ensure-property-viewable.ts';

export interface PropertyQueryOwnerOptionsByCommunityIdCommand {
	communityId: string;
}

/**
 * Lists the community's members for property owner selection. Unlike the
 * general member listing, this read is authorized by the property visa
 * (`canManageProperties` for the requested community), so it exposes member
 * options only to actors who can already manage that community's properties.
 */
export const queryOwnerOptionsByCommunityId = (dataSources: DataSources) => {
	return async (command: PropertyQueryOwnerOptionsByCommunityIdCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]> => {
		ensureCommunityPropertiesViewable(dataSources.passport, command.communityId);
		return await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByCommunityId(command.communityId);
	};
};
