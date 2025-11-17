import type { DataSources } from '@ocom/persistence';
import type * as EndUser from '@ocom/domain/contexts/end-user';

export interface EndUserQueryByIdCommand {
    id: string;
    fields?: string[];
}

export const queryById = (
    dataSources: DataSources,
) => {
    return async (
        command: EndUserQueryByIdCommand,
    ): Promise<EndUser.EndUserEntityReference | null> => {
        return await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getById(
            command.id, 
            { fields: command.fields }
        )
    }
}