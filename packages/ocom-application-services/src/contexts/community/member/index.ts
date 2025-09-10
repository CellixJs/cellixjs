import type { Domain } from '@ocom/api-domain';
import type { DataSources } from '@ocom/api-persistence';
import { type MemberQueryByEndUserExternalIdCommand, queryByEndUserExternalId } from './query-by-end-user-external-id.ts';
import { determineIfAdmin, type MemberDetermineIfAdminCommand } from './determine-if-admin.ts';

export interface MemberApplicationService {
    determineIfAdmin: (command: MemberDetermineIfAdminCommand) => Promise<boolean>,
    queryByEndUserExternalId: (command: MemberQueryByEndUserExternalIdCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>,
}

export const Member = (
    dataSources: DataSources
): MemberApplicationService => {
    return {
        determineIfAdmin: determineIfAdmin(dataSources),
        queryByEndUserExternalId: queryByEndUserExternalId(dataSources),
    }
}