import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { ensurePropertyViewable } from './ensure-property-viewable.ts';

export interface PropertyQueryByIdCommand {
	id: string;
}

export const queryById = (dataSources: DataSources) => {
	return async (command: PropertyQueryByIdCommand): Promise<Domain.Contexts.Property.Property.PropertyEntityReference | null> => {
		const property = await dataSources.readonlyDataSource.Property.Property.PropertyReadRepo.getById(command.id);
		if (property === null) {
			return null;
		}
		ensurePropertyViewable(dataSources.passport, property);
		return property;
	};
};
