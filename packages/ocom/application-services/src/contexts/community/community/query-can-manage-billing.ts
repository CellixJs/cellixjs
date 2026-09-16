import type { DataSources } from '@ocom/persistence';
import { actorCanManageCommunityBilling } from './resolve-community-actor.ts';

export interface CommunityQueryCanManageBillingCommand {
	communityId: string;
	endUserExternalId: string | undefined;
}

/**
 * Whether the acting end user may see this community's billing data. Read paths use
 * this to hide finance fields rather than failing the whole community query, since a
 * member without billing rights may still legitimately read the rest of the community.
 */
export const queryCanManageBilling = (dataSources: DataSources) => {
	return async (command: CommunityQueryCanManageBillingCommand): Promise<boolean> => {
		return await actorCanManageCommunityBilling(dataSources, command.communityId, command.endUserExternalId);
	};
};
