import type { DataSources } from '@ocom/persistence';
import type * as Community from '@ocom/domain/contexts/community';

export interface CommunityQueryByIdCommand {
    id: string;
    fields?: string[];
}

export const queryById = (
    dataSources: DataSources,
) => {
    return async (
        command: CommunityQueryByIdCommand,
    ): Promise<Community.CommunityEntityReference | null> => {
        return await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(
            command.id, 
            { fields: command.fields }
        )
    }
}