import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { getManageablePropertyOrThrow } from './ensure-property-manageable.ts';

export interface PropertyRequestDeleteCommand {
	id: string;
}

export const requestDelete = (dataSources: DataSources) => {
	return async (command: PropertyRequestDeleteCommand): Promise<Domain.Contexts.Property.Property.PropertyEntityReference> => {
		let propertyToReturn: Domain.Contexts.Property.Property.PropertyEntityReference | undefined;
		await dataSources.domainDataSource.Property.Property.PropertyUnitOfWork.withScopedTransaction(async (repo) => {
			const property = await getManageablePropertyOrThrow(repo, command.id);
			property.requestDelete();
			propertyToReturn = await repo.save(property);
		});
		if (!propertyToReturn) {
			throw new Error('property not found');
		}
		return propertyToReturn;
	};
};
