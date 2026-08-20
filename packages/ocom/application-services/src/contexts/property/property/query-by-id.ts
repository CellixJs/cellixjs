import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { isPropertyViewable } from './ensure-property-viewable.ts';

export interface PropertyQueryByIdCommand {
	id: string;
}

export const queryById = (dataSources: DataSources) => {
	return async (command: PropertyQueryByIdCommand): Promise<Domain.Contexts.Property.Property.PropertyEntityReference | null> => {
		const property = await dataSources.readonlyDataSource.Property.Property.PropertyReadRepo.getById(command.id);
		// Unauthorized lookups deny by omission: returning null for both missing
		// ids and properties the passport may not view keeps the two outcomes
		// indistinguishable, so ids cannot be probed for existence across
		// communities.
		if (property === null || !isPropertyViewable(dataSources.passport, property)) {
			return null;
		}
		return property;
	};
};
