import type { DataSources } from '@ocom/persistence';
import type { Community, CommunityEntityReference } from '@ocom/domain/contexts/community';

export interface CommunityQueryByIdCommand {
    id: string;
    fields?: string[];
}

export const queryById = (
    dataSources: DataSources,
) => {
    return async (
        command: CommunityQueryByIdCommand,
    ): Promise<CommunityEntityReference | null> => {
        return await dataSources.readonlyDataSource.Community.CommunityReadRepo.getById(
            command.id, 
            { fields: command.fields }
        )
    }
}