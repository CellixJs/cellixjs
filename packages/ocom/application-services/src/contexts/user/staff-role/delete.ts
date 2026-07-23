import type { DataSources } from '@ocom/persistence';

export interface StaffRoleDeleteCommand {
	roleId: string;
	actorStaffUserId: string;
}

export const deleteStaffRole = (dataSources: DataSources) => {
	return async (command: StaffRoleDeleteCommand): Promise<void> => {
		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repository) => {
			const roleToDelete = await repository.getById(command.roleId);
			roleToDelete.requestDelete(command.actorStaffUserId);
			await repository.save(roleToDelete);
		});
	};
};
