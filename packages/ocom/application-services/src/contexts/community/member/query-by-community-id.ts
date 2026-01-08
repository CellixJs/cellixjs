import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberQueryByCommunityIdCommand {
    communityId: string;
    fields?: string[];
};

export const queryByCommunityId = (
    dataSources: DataSources,
) => {
    return async (
        command: MemberQueryByCommunityIdCommand,
    ): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]> => {
        return await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByCommunityId(
            command.communityId,
        )
    }
}
