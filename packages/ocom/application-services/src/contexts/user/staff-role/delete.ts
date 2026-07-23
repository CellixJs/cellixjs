import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface StaffRoleDeleteCommand {
	roleId: string;
	actorStaffUserId: string;
	actorStaffRoleId?: string;
}

export const deleteStaffRole = (dataSources: DataSources) => {
	return async (command: StaffRoleDeleteCommand): Promise<void> => {
		let deletedRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps> | undefined;
		const unitOfWork = dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork;

		try {
			await unitOfWork.withScopedTransaction(async (repository) => {
				const roleToDelete = await repository.getById(command.roleId);
				deletedRole = roleToDelete;
				roleToDelete.requestDelete(command.actorStaffUserId, command.actorStaffRoleId);
				await repository.save(roleToDelete);
			});
		} catch (error) {
			const roleToRestore = deletedRole;
			if (!(error instanceof MongooseSeedwork.PostCommitEventError) || error.eventName !== Domain.Events.StaffRoleDeletedEvent.name || !roleToRestore) {
				throw error;
			}

			try {
				const systemPassport = Domain.PassportFactory.forSystem({
					canManageStaffRolesAndPermissions: true,
				});
				await unitOfWork.withTransaction(systemPassport, async (repository) => {
					await repository.restoreDeleted(roleToRestore);
				});
			} catch (restoreError) {
				throw new AggregateError([error, restoreError], `Staff role ${command.roleId} deletion failed and the role could not be restored`);
			}

			throw error;
		}
	};
};
