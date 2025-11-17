import type { DataSources } from '@ocom/persistence';
import type * as Member from '@ocom/domain/contexts/member';

export interface MemberQueryByEndUserExternalIdCommand {
    externalId: string;
    fields?: string[];
};

export const queryByEndUserExternalId = (
    dataSources: DataSources,
) => {
    return async (
        command: MemberQueryByEndUserExternalIdCommand,
    ): Promise<Member.MemberEntityReference[]> => {
        return await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getMembersForEndUserExternalId(
            command.externalId,
        )
    }
}