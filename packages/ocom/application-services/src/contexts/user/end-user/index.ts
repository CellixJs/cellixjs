import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { type EndUserQueryByIdCommand, queryById  } from './query-by-id.ts';
import { type EndUserQueryByNameCommand, queryByName } from './query-by-name.ts';
import { createIfNotExists, type EndUserCreateCommand } from './create-if-not-exists.ts';

export interface EndUserApplicationService {
    createIfNotExists: (command: EndUserCreateCommand) => Promise<Domain.User.EndUser.EndUserEntityReference>;
    queryById: (command: EndUserQueryByIdCommand) => Promise<Domain.User.EndUser.EndUserEntityReference | null>
    queryByName: (command: EndUserQueryByNameCommand) => Promise<Domain.User.EndUser.EndUserEntityReference[]>;
}

export const EndUser = (
    dataSources: DataSources,
): EndUserApplicationService => {
    return {
        createIfNotExists: createIfNotExists(dataSources),
        queryById: queryById(dataSources),
        queryByName: queryByName(dataSources)
    }
}