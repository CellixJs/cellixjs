import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberQueryByIdCommand {
	id: string;
}

export const queryById = (dataSources: DataSources) => {
	return async (command: MemberQueryByIdCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let member: Domain.Contexts.Community.Member.MemberEntityReference | undefined;

		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repository) => {
			member = await repository.getById(command.id);
		});

		if (!member) {
			throw new Error(`Member with id ${command.id} not found`);
		}

		return member;
	};
};

export interface MemberQueryByEndUserExternalIdCommand {
	externalId: string;
	fields?: string[];
}

export const queryByEndUserExternalId = (dataSources: DataSources) => {
	return async (command: MemberQueryByEndUserExternalIdCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]> => {
		return await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getMembersForEndUserExternalId(command.externalId);
	};
};
