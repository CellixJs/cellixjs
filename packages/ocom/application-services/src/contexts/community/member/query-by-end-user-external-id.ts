import type { DataSources } from '@ocom/persistence';
import type { MemberEntityReference } from '@ocom/domain/contexts/member';

export interface MemberQueryByEndUserExternalIdCommand {
    externalId: string;
    fields?: string[];
};

export const queryByEndUserExternalId = (
    dataSources: DataSources,
) => {
    return async (
        command: MemberQueryByEndUserExternalIdCommand,
    ): Promise<MemberEntityReference[]> => {
        return await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getMembersForEndUserExternalId(
            command.externalId,
        )
    }
}