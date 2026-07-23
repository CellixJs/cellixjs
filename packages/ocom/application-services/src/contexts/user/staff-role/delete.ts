import type { DataSources } from '@ocom/persistence';

export interface StaffRoleDeleteCommand {
	roleId: string;
	actorStaffUserId: string;
	actorStaffRoleId?: string;
}

export const deleteStaffRole = (dataSources: DataSources) => {
	return async (command: StaffRoleDeleteCommand): Promise<void> => {
		const unitOfWork = dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork;

		await unitOfWork.withScopedTransaction(async (repository) => {
			const roleToDelete = await repository.getById(command.roleId);
			roleToDelete.requestDelete(command.actorStaffUserId, command.actorStaffRoleId);
			await repository.save(roleToDelete);
		});
	};
};
