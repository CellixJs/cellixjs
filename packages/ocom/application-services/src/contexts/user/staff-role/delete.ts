import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface StaffRoleDeleteCommand {
	roleId: string;
	actorStaffUserId: string;
}

export const deleteStaffRole = (dataSources: DataSources) => {
	return async (command: StaffRoleDeleteCommand): Promise<void> => {
		let deletionPrepared = false;
		let deletionAlreadyCompleted = false;
		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repository) => {
			const roleToDelete = await repository.getByIdForDeletion(command.roleId);
			const replacementRole = roleToDelete.deletionStatus === 'active' ? await repository.getDefaultRoleByEnterpriseAppRole(roleToDelete.enterpriseAppRole) : undefined;
			roleToDelete.requestDelete(replacementRole);
			if (roleToDelete.deletionStatus === 'deleted') {
				deletionAlreadyCompleted = true;
				return;
			}
			await repository.save(roleToDelete);
			deletionPrepared = true;
		});

		if (deletionAlreadyCompleted) {
			return;
		}
		if (!deletionPrepared) {
			throw new Error(`Unable to prepare staff role ${command.roleId} for deletion`);
		}

		await Domain.Services.User.StaffRoleDeletedReassignmentService.reassignStaffUsersToDefaultRole(command.roleId, command.actorStaffUserId, dataSources.domainDataSource);

		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repository) => {
			const roleToDelete = await repository.getByIdForDeletion(command.roleId);
			if (roleToDelete.deletionStatus === 'deleted') {
				return;
			}
			roleToDelete.completeDelete(command.actorStaffUserId);
			await repository.save(roleToDelete);
		});
	};
};
