import type { DataSources } from '@ocom/persistence';
import { type MemberQueryByEndUserExternalIdCommand, queryByEndUserExternalId } from './query-by-end-user-external-id.ts';
import { determineIfAdmin, type MemberDetermineIfAdminCommand } from './determine-if-admin.ts';
import type { MemberEntityReference } from '@ocom/domain/contexts/member';

export interface MemberApplicationService {
    determineIfAdmin: (command: MemberDetermineIfAdminCommand) => Promise<boolean>,
    queryByEndUserExternalId: (command: MemberQueryByEndUserExternalIdCommand) => Promise<MemberEntityReference[]>,
}

export const Member = (
    dataSources: DataSources
): MemberApplicationService => {
    return {
        determineIfAdmin: determineIfAdmin(dataSources),
        queryByEndUserExternalId: queryByEndUserExternalId(dataSources),
    }
}