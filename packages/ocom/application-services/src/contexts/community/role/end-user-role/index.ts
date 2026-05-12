import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { type EndUserRoleQueryByCommunityIdCommand, queryByCommunityId } from './query-by-community-id.ts';
import { type EndUserRoleQueryByIdCommand, queryById } from './query-by-id.ts';

export interface EndUserRoleApplicationService {
	queryById: (command: EndUserRoleQueryByIdCommand) => Promise<Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference | null>;
	queryByCommunityId: (command: EndUserRoleQueryByCommunityIdCommand) => Promise<Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference[]>;
}

export const EndUserRole = (dataSources: DataSources): EndUserRoleApplicationService => {
	return {
		queryById: queryById(dataSources),
		queryByCommunityId: queryByCommunityId(dataSources),
	};
};
