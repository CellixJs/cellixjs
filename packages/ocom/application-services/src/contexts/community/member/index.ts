import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { determineIfAdmin, type MemberDetermineIfAdminCommand } from './determine-if-admin.ts';
import { type MemberQueryByCommunityIdCommand, queryByCommunityId } from './query-by-community-id.ts';
import { type MemberQueryByEndUserExternalIdCommand, queryByEndUserExternalId } from './query-by-end-user-external-id.ts';

export interface MemberApplicationService {
	determineIfAdmin: (command: MemberDetermineIfAdminCommand) => Promise<boolean>;
	queryByCommunityId: (command: MemberQueryByCommunityIdCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
	queryByEndUserExternalId: (command: MemberQueryByEndUserExternalIdCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
}

export const Member = (dataSources: DataSources): MemberApplicationService => {
	return {
		determineIfAdmin: determineIfAdmin(dataSources),
		queryByCommunityId: queryByCommunityId(dataSources),
		queryByEndUserExternalId: queryByEndUserExternalId(dataSources),
	};
};
