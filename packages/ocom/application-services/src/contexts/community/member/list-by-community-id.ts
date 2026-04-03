import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberListByCommunityIdCommand {
	communityId: string;
}

export const listByCommunityId = (dataSources: DataSources) => {
	return async (command: MemberListByCommunityIdCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]> => {
		return await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByCommunityId(command.communityId);
	};
};
