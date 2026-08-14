import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { applyPropertyFields, type PropertyFieldsCommand, type PropertyListingDetailFieldsCommand } from './apply-property-fields.ts';

export type PropertyUpdateListingDetailCommand = PropertyListingDetailFieldsCommand;

export interface PropertyUpdateCommand extends PropertyFieldsCommand {
	id: string;
	propertyName?: string;
}

export const update = (dataSources: DataSources) => {
	return async (command: PropertyUpdateCommand): Promise<Domain.Contexts.Property.Property.PropertyEntityReference> => {
		let propertyToReturn: Domain.Contexts.Property.Property.PropertyEntityReference | undefined;
		await dataSources.domainDataSource.Property.Property.PropertyUnitOfWork.withScopedTransaction(async (repo) => {
			const property = await repo.getById(command.id);
			property.assertCanManageProperties();

			if (command.propertyName !== undefined && command.propertyName !== null) {
				property.propertyName = command.propertyName;
			}
			await applyPropertyFields(dataSources, property, command);

			propertyToReturn = await repo.save(property);
		});
		if (!propertyToReturn) {
			throw new Error('property not found');
		}
		return propertyToReturn;
	};
};
