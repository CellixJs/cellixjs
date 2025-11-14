import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberQueryByEndUserExternalIdCommand {
    externalId: string;
    fields?: string[];
};

export const queryByEndUserExternalId = (
    dataSources: DataSources,
) => {
    return async (
        command: MemberQueryByEndUserExternalIdCommand,
    ): Promise<Domain.Member.MemberEntityReference[]> => {
        return await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getMembersForEndUserExternalId(
            command.externalId,
        )
    }
}