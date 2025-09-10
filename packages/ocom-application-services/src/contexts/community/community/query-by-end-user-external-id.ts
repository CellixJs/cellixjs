import type { Domain } from '@ocom/api-domain';
import type { DataSources } from '@ocom/api-persistence';

export interface CommunityQueryByEndUserExternalIdCommand {
    externalId: string;
    fields?: string[];
};

export const queryByEndUserExternalId = (
    dataSources: DataSources,
) => {
    return async (
        command: CommunityQueryByEndUserExternalIdCommand,
    ): Promise<Domain.Contexts.Community.Community.CommunityEntityReference[]> => {
        return await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getByEndUserExternalId(
            command.externalId,
        )
    }
}