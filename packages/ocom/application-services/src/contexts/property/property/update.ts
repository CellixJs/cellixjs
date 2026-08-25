import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { applyPropertyFields, type PropertyFieldsCommand, type PropertyListingDetailFieldsCommand } from './apply-property-fields.ts';
import { getManageablePropertyOrThrow } from './ensure-property-manageable.ts';

export type PropertyUpdateListingDetailCommand = PropertyListingDetailFieldsCommand;

export interface PropertyUpdateCommand extends PropertyFieldsCommand {
	id: string;
	propertyName?: string;
}

export const update = (dataSources: DataSources) => {
	return async (command: PropertyUpdateCommand): Promise<Domain.Contexts.Property.Property.PropertyEntityReference> => {
		let propertyToReturn: Domain.Contexts.Property.Property.PropertyEntityReference | undefined;
		await dataSources.domainDataSource.Property.Property.PropertyUnitOfWork.withScopedTransaction(async (repo) => {
			const property = await getManageablePropertyOrThrow(repo, command.id);

			if (command.propertyName !== undefined && command.propertyName !== null) {
				// Friendly pre-check on rename only (exact string compare, matching the
				// partial unique index semantics). The check-then-write race is
				// acceptable here; the index backstops it.
				if (command.propertyName !== property.propertyName) {
					const nameTaken = await dataSources.readonlyDataSource.Property.Property.PropertyReadRepo.isPropertyNameTaken(property.community.id, command.propertyName);
					if (nameTaken) {
						throw new Error('A property with this name already exists');
					}
				}
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
