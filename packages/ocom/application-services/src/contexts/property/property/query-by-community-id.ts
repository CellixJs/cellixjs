import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { ensureCommunityPropertiesViewable, ensurePropertyViewable } from './ensure-property-viewable.ts';

export interface PropertyQueryByCommunityIdCommand {
	communityId: string;
}

export const queryByCommunityId = (dataSources: DataSources) => {
	return async (command: PropertyQueryByCommunityIdCommand): Promise<Domain.Contexts.Property.Property.PropertyEntityReference[]> => {
		// Authorize against the requested community before reading, so empty
		// communities reject unauthorized actors instead of leaking an empty list.
		ensureCommunityPropertiesViewable(dataSources.passport, command.communityId);
		const properties = await dataSources.readonlyDataSource.Property.Property.PropertyReadRepo.getByCommunityId(command.communityId);
		for (const property of properties) {
			ensurePropertyViewable(dataSources.passport, property);
		}
		return properties;
	};
};
