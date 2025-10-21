import type { DataSources } from '@ocom/persistence';

export interface StaffRoleDeleteAndReassignCommand {
	roleId: string;
	reassignToRoleId: string;
}

export const deleteAndReassign = (dataSources: DataSources) => {
	return async (command: StaffRoleDeleteAndReassignCommand): Promise<void> => {
		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(
			async (repository) => {
				const roleToDelete = await repository.getById(command.roleId);
				const roleToAssign = await repository.getById(
					command.reassignToRoleId,
				);
				roleToDelete.deleteAndReassignTo(roleToAssign);
				await repository.save(roleToDelete);
			},
		);
	};
};
