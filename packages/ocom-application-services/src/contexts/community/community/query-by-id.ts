import type { Domain } from '@ocom/api-domain';
import type { DataSources } from '@ocom/api-persistence';

export interface CommunityQueryByIdCommand {
    id: string;
    fields?: string[];
}

export const queryById = (
    dataSources: DataSources,
) => {
    return async (
        command: CommunityQueryByIdCommand,
    ): Promise<Domain.Contexts.Community.Community.CommunityEntityReference | null> => {
        return await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(
            command.id, 
            { fields: command.fields }
        )
    }
}