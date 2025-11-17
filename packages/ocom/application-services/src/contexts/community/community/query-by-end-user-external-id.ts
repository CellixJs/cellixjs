import type { DataSources } from '@ocom/persistence';
import type * as Community from '@ocom/domain/contexts/community';

export interface CommunityQueryByEndUserExternalIdCommand {
    externalId: string;
    fields?: string[];
};

export const queryByEndUserExternalId = (
    dataSources: DataSources,
) => {
    return async (
        command: CommunityQueryByEndUserExternalIdCommand,
    ): Promise<Community.CommunityEntityReference[]> => {
        return await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getByEndUserExternalId(
            command.externalId,
        )
    }
}