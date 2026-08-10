import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface PropertyQueryByIdCommand {
	id: string;
}

export const queryById = (dataSources: DataSources) => {
	return async (command: PropertyQueryByIdCommand): Promise<Domain.Contexts.Property.Property.PropertyEntityReference | null> => {
		return await dataSources.readonlyDataSource.Property.Property.PropertyReadRepo.getById(command.id);
	};
};
