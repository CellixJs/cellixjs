import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { type CommunityCreateCommand, create,  } from './create.ts';
import { type CommunityQueryByEndUserExternalIdCommand, queryByEndUserExternalId } from './query-by-end-user-external-id.ts';
import { type CommunityQueryByIdCommand, queryById } from './query-by-id.ts';


export interface CommunityApplicationService {
    create: (command: CommunityCreateCommand) => Promise<Domain.Community.CommunityEntityReference>,
    queryById: (command: CommunityQueryByIdCommand) => Promise<Domain.Community.CommunityEntityReference | null>,
    queryByEndUserExternalId: (command: CommunityQueryByEndUserExternalIdCommand) => Promise<Domain.Community.CommunityEntityReference[]>,
}

export const Community = (
    dataSources: DataSources
): CommunityApplicationService => {
    return {
        create: create(dataSources),
        queryById: queryById(dataSources),
        queryByEndUserExternalId: queryByEndUserExternalId(dataSources),
    }
}