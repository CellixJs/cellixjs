import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface EndUserRoleQueryByCommunityIdCommand {
	communityId: string;
}

export const queryByCommunityId = (dataSources: DataSources) => {
	return async (command: EndUserRoleQueryByCommunityIdCommand): Promise<Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference[]> => {
		let roles: Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference[] = [];

		await dataSources.domainDataSource.Community.Role.EndUserRole.EndUserRoleUnitOfWork.withScopedTransaction(async (roleRepository) => {
			roles = await roleRepository.getByCommunityId(command.communityId);
		});

		return roles;
	};
};
