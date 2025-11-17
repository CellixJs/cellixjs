import type { DataSources } from '@ocom/persistence';
import type * as Service from '@ocom/domain/contexts/service';

export interface ServiceCreateCommand {
	readonly serviceName: string;
	readonly description: string;
	readonly communityId: string;
}

export const create = (dataSources: DataSources) => {
	return async (
		command: ServiceCreateCommand,
	): Promise<Service.ServiceEntityReference> => {
		const community =
			await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(
				command.communityId,
			);
		if (!community) {
			throw new Error('Community not found');
		}

		let serviceToReturn:
			Service.ServiceEntityReference | undefined;
		await dataSources.domainDataSource.Service.Service.ServiceUnitOfWork.withScopedTransaction(
			async (repo) => {
				const newService = await repo.getNewInstance(
					command.serviceName,
					command.description,
					community,
				);
				serviceToReturn = await repo.save(newService);
			},
		);

		if (!serviceToReturn) {
			throw new Error('service not found');
		}

		return serviceToReturn;
	};
};