import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { assignRole, type StaffUserAssignRoleCommand } from './assign-role.ts';
import { createIfNotExists, type StaffUserCreateIfNotExistsCommand } from './create-if-not-exists.ts';
import { list } from './list.ts';
import { queryByExternalId, type StaffUserQueryByExternalIdCommand } from './query-by-external-id.ts';

export interface StaffUserApplicationService {
	assignRole: (command: StaffUserAssignRoleCommand) => Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference>;
	createIfNotExists: (command: StaffUserCreateIfNotExistsCommand) => Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference>;
	list: () => Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference[]>;
	queryByExternalId: (command: StaffUserQueryByExternalIdCommand) => Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference | null>;
}

export const StaffUser = (dataSources: DataSources): StaffUserApplicationService => {
	return {
		assignRole: assignRole(dataSources),
		createIfNotExists: createIfNotExists(dataSources),
		list: list(dataSources),
		queryByExternalId: queryByExternalId(dataSources),
	};
};
