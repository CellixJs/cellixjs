import type { DataSources } from '@ocom/persistence';
import { type EndUserQueryByIdCommand, queryById  } from './query-by-id.ts';
import { type EndUserQueryByNameCommand, queryByName } from './query-by-name.ts';
import { createIfNotExists, type EndUserCreateCommand } from './create-if-not-exists.ts';
import type { EndUserEntityReference } from '@ocom/domain/contexts/end-user';

export interface EndUserApplicationService {
    createIfNotExists: (command: EndUserCreateCommand) => Promise<EndUserEntityReference>;
    queryById: (command: EndUserQueryByIdCommand) => Promise<EndUserEntityReference | null>
    queryByName: (command: EndUserQueryByNameCommand) => Promise<EndUserEntityReference[]>;
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