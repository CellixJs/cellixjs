import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { DataSources } from '@ocom/persistence';

export interface StaffRoleDeleteCommand {
	roleId: string;
	actorStaffUserId: string;
	actorStaffRoleId?: string;
}

export interface StaffRoleDeleteResult {
	reassignmentPending: boolean;
}

export const deleteStaffRole = (dataSources: DataSources) => {
	return async (command: StaffRoleDeleteCommand): Promise<StaffRoleDeleteResult> => {
		const unitOfWork = dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork;

		try {
			await unitOfWork.withScopedTransaction(async (repository) => {
				const roleToDelete = await repository.getById(command.roleId);
				roleToDelete.requestDelete(command.actorStaffUserId, command.actorStaffRoleId);
				await repository.save(roleToDelete);
			});
		} catch (error) {
			if (error instanceof MongooseSeedwork.PostCommitEventError) {
				return { reassignmentPending: true };
			}
			throw error;
		}

		return { reassignmentPending: false };
	};
};
