import type { Domain } from '@ocom/api-domain';
import type { DataSources } from '@ocom/api-persistence';

export interface EndUserQueryByIdCommand {
    id: string;
    fields?: string[];
}

export const queryById = (
    dataSources: DataSources,
) => {
    return async (
        command: EndUserQueryByIdCommand,
    ): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null> => {
        return await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getById(
            command.id, 
            { fields: command.fields }
        )
    }
}