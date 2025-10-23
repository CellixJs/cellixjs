import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface ServiceCreateCommand {
	readonly serviceName: string;
	readonly description: string;
	readonly communityId: string;
}

export const create = (dataSources: DataSources) => {
	return async (
		command: ServiceCreateCommand,
	): Promise<Domain.Contexts.Service.Service.ServiceEntityReference> => {
		const community =
			await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(
				command.communityId,
			);
		if (!community) {
			throw new Error('Community not found');
		}

		let serviceToReturn:
			Domain.Contexts.Service.Service.ServiceEntityReference | undefined;
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