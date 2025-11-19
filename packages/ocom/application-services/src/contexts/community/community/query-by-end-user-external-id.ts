import type { DataSources } from '@ocom/persistence';
import type { Community, CommunityEntityReference } from '@ocom/domain/contexts/community';

export interface CommunityQueryByEndUserExternalIdCommand {
    externalId: string;
    fields?: string[];
};

export const queryByEndUserExternalId = (
    dataSources: DataSources,
) => {
    return async (
        command: CommunityQueryByEndUserExternalIdCommand,
    ): Promise<CommunityEntityReference[]> => {
        return await dataSources.readonlyDataSource.Community.CommunityReadRepo.getByEndUserExternalId(
            command.externalId,
        )
    }
}