import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface EndUserQueryByIdCommand {
    id: string;
    fields?: string[];
}

export const queryById = (
    dataSources: DataSources,
) => {
    return async (
        command: EndUserQueryByIdCommand,
    ): Promise<Domain.EndUser.EndUserEntityReference | null> => {
        return await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getById(
            command.id, 
            { fields: command.fields }
        )
    }
}