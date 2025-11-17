import type { DataSources } from '@ocom/persistence';
import { type CommunityCreateCommand, create,  } from './create.ts';
import { type CommunityQueryByEndUserExternalIdCommand, queryByEndUserExternalId } from './query-by-end-user-external-id.ts';
import { type CommunityQueryByIdCommand, queryById } from './query-by-id.ts';
import type * as Community from '@ocom/domain/contexts/community';


export interface CommunityApplicationService {
    create: (command: CommunityCreateCommand) => Promise<Community.CommunityEntityReference>,
    queryById: (command: CommunityQueryByIdCommand) => Promise<Community.CommunityEntityReference | null>,
    queryByEndUserExternalId: (command: CommunityQueryByEndUserExternalIdCommand) => Promise<Community.CommunityEntityReference[]>,
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