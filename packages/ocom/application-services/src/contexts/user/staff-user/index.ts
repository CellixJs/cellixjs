import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { createIfNotExists, type StaffUserCreateIfNotExistsCommand } from './create-if-not-exists.ts';
import { queryByExternalId, type StaffUserQueryByExternalIdCommand } from './query-by-external-id.ts';

export interface StaffUserApplicationService {
	createIfNotExists: (command: StaffUserCreateIfNotExistsCommand) => Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference>;
	queryByExternalId: (command: StaffUserQueryByExternalIdCommand) => Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference | null>;
}

export const StaffUser = (dataSources: DataSources): StaffUserApplicationService => {
	return {
		createIfNotExists: createIfNotExists(dataSources),
		queryByExternalId: queryByExternalId(dataSources),
	};
};
