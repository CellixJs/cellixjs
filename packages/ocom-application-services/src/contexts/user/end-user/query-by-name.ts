import type { Domain } from '@ocom/api-domain';
import type { DataSources } from '@ocom/api-persistence';

export interface EndUserQueryByNameCommand {
    displayName: string;
    fields?: string[];
}

export const queryByName = (
    dataSources: DataSources
) => {
    return async (
        command: EndUserQueryByNameCommand,
    ): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]> => {
        return await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByName(
            command.displayName,
            {
                fields: command.fields
            }
        );
    }
}