import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface PropertyCreateCommand {
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

		let propertyToReturn: Domain.Contexts.Property.Property.PropertyEntityReference | undefined;
		await dataSources.domainDataSource.Property.Property.PropertyUnitOfWork.withScopedTransaction(async (repo) => {
			const newProperty = await repo.getNewInstance(command.propertyName, communityToUse);
			propertyToReturn = await repo.save(newProperty);
		});
		if (!propertyToReturn) {
			throw new Error('property not found');
		}
		return propertyToReturn;
	};
};
