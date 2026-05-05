import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface StaffUserQueryByExternalIdCommand {
	externalId: string;
}

export const queryByExternalId = (dataSources: DataSources) => {
	return async (command: StaffUserQueryByExternalIdCommand): Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference | null> => {
		return await dataSources.readonlyDataSource.User.StaffUser.StaffUserReadRepo.getByExternalId(command.externalId);
	};
};
