import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface EndUserRoleQueryByIdCommand {
	id: string;
}

export const queryById = (dataSources: DataSources) => {
	return async (command: EndUserRoleQueryByIdCommand): Promise<Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference | null> => {
		let role: Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference | null = null;

		await dataSources.domainDataSource.Community.Role.EndUserRole.EndUserRoleUnitOfWork.withScopedTransaction(async (roleRepository) => {
			role = await roleRepository.getById(command.id);
		});

		return role;
	};
};
