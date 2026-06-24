import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export const list = (dataSources: DataSources) => {
	return async (): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference[]> => {
		return await dataSources.readonlyDataSource.User.StaffRole.StaffRoleReadRepo.getAll();
	};
};
