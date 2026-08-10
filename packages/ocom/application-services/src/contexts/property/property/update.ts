import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface PropertyUpdateListingDetailCommand {
	bedrooms?: number | null;
	bathrooms?: number | null;
	squareFeet?: number | null;
}

export interface PropertyUpdateCommand {
	id: string;
	propertyName?: string;
	propertyType?: string;
	listingDetail?: PropertyUpdateListingDetailCommand;
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
			if (command.propertyType !== undefined && command.propertyType !== null) {
				property.propertyType = command.propertyType;
			}
			if (command.listingDetail !== undefined && command.listingDetail !== null) {
				const listingDetail = property.listingDetail as Domain.Contexts.Property.Property.PropertyListingDetail;
				// Explicit null clears a value; undefined leaves it untouched.
				if (command.listingDetail.bedrooms !== undefined) {
					listingDetail.bedrooms = new Domain.Contexts.Property.Property.ListingDetailValueObjects.Bedrooms(command.listingDetail.bedrooms);
				}
				if (command.listingDetail.bathrooms !== undefined) {
					listingDetail.bathrooms = new Domain.Contexts.Property.Property.ListingDetailValueObjects.Bathrooms(command.listingDetail.bathrooms);
				}
				if (command.listingDetail.squareFeet !== undefined) {
					listingDetail.squareFeet = new Domain.Contexts.Property.Property.ListingDetailValueObjects.SquareFeet(command.listingDetail.squareFeet);
				}
			}

			propertyToReturn = await repo.save(property);
		});
		if (!propertyToReturn) {
			throw new Error('property not found');
		}
		return propertyToReturn;
	};
};
