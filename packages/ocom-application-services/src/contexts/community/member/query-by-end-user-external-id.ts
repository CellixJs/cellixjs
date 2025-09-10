import type { Domain } from '@ocom/api-domain';
import type { DataSources } from '@ocom/api-persistence';

export interface MemberQueryByEndUserExternalIdCommand {
    externalId: string;
    fields?: string[];
};

export const queryByEndUserExternalId = (
    dataSources: DataSources,
) => {
    return async (
        command: MemberQueryByEndUserExternalIdCommand,
    ): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]> => {
        return await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getMembersForEndUserExternalId(
            command.externalId,
        )
    }
}