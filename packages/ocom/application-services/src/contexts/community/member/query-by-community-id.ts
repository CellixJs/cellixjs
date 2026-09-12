import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { ensureCommunityMembersViewable, ensureMemberViewable } from './ensure-member-viewable.ts';

export interface MemberQueryByCommunityIdCommand {
	communityId: string;
	fields?: string[];
}

export const queryByCommunityId = (dataSources: DataSources) => {
	return async (command: MemberQueryByCommunityIdCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]> => {
		ensureCommunityMembersViewable(dataSources.passport, command.communityId);
		const members = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByCommunityId(command.communityId, { fields: command.fields });
		for (const member of members) {
			ensureMemberViewable(dataSources.passport, member);
		}
		return members;
	};
};
