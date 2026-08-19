import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { applyPropertyFields, type PropertyFieldsCommand } from './apply-property-fields.ts';

export interface PropertyCreateCommand extends PropertyFieldsCommand {
	propertyName: string;
	communityId: string;
}

export const create = (dataSources: DataSources) => {
	return async (command: PropertyCreateCommand): Promise<Domain.Contexts.Property.Property.PropertyEntityReference> => {
		let community: Domain.Contexts.Community.Community.CommunityEntityReference | undefined;
		await dataSources.domainDataSource.Community.Community.CommunityUnitOfWork.withScopedTransaction(async (repo) => {
			community = await repo.get(command.communityId);
		});
		if (!community) {
			throw new Error(`Community not found for id ${command.communityId}`);
		}
		const communityToUse = community;

		// Friendly pre-check for the partial unique index on { community, propertyName }.
		// The check-then-write race is acceptable here; the index backstops it.
		const nameTaken = await dataSources.readonlyDataSource.Property.Property.PropertyReadRepo.isPropertyNameTaken(command.communityId, command.propertyName);
		if (nameTaken) {
			throw new Error('A property with this name already exists');
		}

		let propertyToReturn: Domain.Contexts.Property.Property.PropertyEntityReference | undefined;
		await dataSources.domainDataSource.Property.Property.PropertyUnitOfWork.withScopedTransaction(async (repo) => {
			const newProperty = await repo.getNewInstance(command.propertyName, communityToUse);
			// The remaining fields are applied within the same transaction; the
			// aggregate setters enforce the manage-properties authorization.
			await applyPropertyFields(dataSources, newProperty, command);
			propertyToReturn = await repo.save(newProperty);
		});
		if (!propertyToReturn) {
			throw new Error('property not found');
		}
		return propertyToReturn;
	};
};
