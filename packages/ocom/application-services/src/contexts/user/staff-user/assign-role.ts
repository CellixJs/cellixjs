import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface StaffUserAssignRoleCommand {
	staffUserId: string;
	roleId: string;
	actorStaffUserId: string;
}

const isNotFoundError = (error: unknown): boolean => error instanceof Error && (error.name === 'NotFoundError' || error.message.toLowerCase().includes('not found'));
const DELETION_OUTCOME_TIMEOUT_MS = 5_000;
const DELETION_OUTCOME_POLL_MS = 25;

export const assignRole = (dataSources: DataSources) => {
	return async (command: StaffUserAssignRoleCommand): Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference> => {
		let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;
		let role!: Domain.Contexts.User.StaffRole.StaffRoleEntityReference;

		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (staffRoleRepo) => {
			role = await staffRoleRepo.getByIdForAssignment(command.roleId);
		});

		await dataSources.domainDataSource.User.StaffUser.StaffUserUnitOfWork.withScopedTransaction(async (staffUserRepo) => {
			const staffUser = await staffUserRepo.get(command.staffUserId);
			// Build a descriptive activity message including role name, target user and actor (fallback to IDs when names unavailable)
			let actorDisplayName = command.actorStaffUserId;
			try {
				const actor = await staffUserRepo.get(command.actorStaffUserId);
				if (actor?.displayName) actorDisplayName = actor.displayName;
			} catch (e) {
				const error = e as Error;
				if (error.name !== 'NotFoundError') {
					throw error;
				}
			}
			const roleName = role.roleName ?? command.roleId;
			const description = `${roleName} assigned by ${actorDisplayName}`;
			staffUser.requestRoleAssignment(role, description, command.actorStaffUserId);
			result = await staffUserRepo.save(staffUser);
		});

		if (!result) {
			throw new Error('Unable to assign role to staff user');
		}

		try {
			await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (staffRoleRepo) => {
				await staffRoleRepo.getByIdForAssignment(command.roleId);
			});
		} catch (error) {
			if (!isNotFoundError(error)) {
				throw error;
			}

			const readDeletionStatus = async (): Promise<Domain.Contexts.User.StaffRole.StaffRoleDeletionStatus> => {
				const outcome: { status?: Domain.Contexts.User.StaffRole.StaffRoleDeletionStatus } = {};
				await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (staffRoleRepo) => {
					outcome.status = await staffRoleRepo.getDeletionStatus(command.roleId);
				});
				if (!outcome.status) {
					throw new Error(`Unable to determine deletion status for StaffRole with id ${command.roleId}`);
				}
				return outcome.status;
			};

			const deadline = Date.now() + DELETION_OUTCOME_TIMEOUT_MS;
			let deletionStatus = await readDeletionStatus();
			while (deletionStatus === 'deleting' && Date.now() < deadline) {
				await new Promise((resolve) => setTimeout(resolve, DELETION_OUTCOME_POLL_MS));
				deletionStatus = await readDeletionStatus();
			}

			if (deletionStatus === 'active') {
				return result;
			}
			if (deletionStatus === 'deleting') {
				throw new Error(`StaffRole with id ${command.roleId} deletion is still in progress; assignment outcome is pending`);
			}

			await Domain.Services.User.StaffRoleDeletedReassignmentService.reassignStaffUsersToDefaultRole(command.roleId, command.actorStaffUserId, dataSources.domainDataSource);
			const unavailableRoleError = new Error(`StaffRole with id ${command.roleId} is no longer available for assignment`);
			unavailableRoleError.name = 'NotFoundError';
			throw unavailableRoleError;
		}

		return result;
	};
};
