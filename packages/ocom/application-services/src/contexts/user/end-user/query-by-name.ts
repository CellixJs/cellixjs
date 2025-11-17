import type { DataSources } from '@ocom/persistence';
import type * as EndUser from '@ocom/domain/contexts/end-user';

export interface EndUserQueryByNameCommand {
    displayName: string;
    fields?: string[];
}

export const queryByName = (
    dataSources: DataSources
) => {
    return async (
        command: EndUserQueryByNameCommand,
    ): Promise<EndUser.EndUserEntityReference[]> => {
        return await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByName(
            command.displayName,
            {
                fields: command.fields
            }
        );
    }
}