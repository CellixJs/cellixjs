import type { DataSources } from '@ocom/persistence';
import { ensureCommunityPropertiesManageable } from './ensure-property-viewable.ts';

export interface PropertyQueryOwnerOptionsByCommunityIdCommand {
	communityId: string;
}

/**
 * Minimal projection returned for owner selection: the query is authorized
 * for property managers, so it must not hand back full member records.
 */
export interface PropertyOwnerOption {
	id: string;
	memberName: string;
}

/**
 * Lists the community's members for property owner selection. Unlike the
 * general member listing, this read is authorized by the property visa
 * (`canManageProperties` for the requested community), so it exposes member
 * options only to actors who can already manage that community's properties.
 * Results are mapped down to id + display name so no other member data
 * (accounts, profile, role) leaves this service.
 */
export const queryOwnerOptionsByCommunityId = (dataSources: DataSources) => {
	return async (command: PropertyQueryOwnerOptionsByCommunityIdCommand): Promise<PropertyOwnerOption[]> => {
		ensureCommunityPropertiesManageable(dataSources.passport, command.communityId);
		const members = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByCommunityId(command.communityId);
		return members.map((member) => ({
			id: member.id,
			memberName: member.memberName,
		}));
	};
};
