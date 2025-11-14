import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface CommunityQueryByEndUserExternalIdCommand {
    externalId: string;
    fields?: string[];
};

export const queryByEndUserExternalId = (
    dataSources: DataSources,
) => {
    return async (
        command: CommunityQueryByEndUserExternalIdCommand,
    ): Promise<Domain.Community.Community.CommunityEntityReference[]> => {
        return await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getByEndUserExternalId(
            command.externalId,
        )
    }
}