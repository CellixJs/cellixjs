import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface StaffUserAssignRoleCommand {
	staffUserId: string;
	roleId: string;
	actorStaffUserId: string;
}

export const assignRole = (dataSources: DataSources) => {
	return async (command: StaffUserAssignRoleCommand): Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference> => {
		let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;
		let role: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;
		let previousRoleId: string | undefined;

		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (staffRoleRepo) => {
			role = await staffRoleRepo.getById(command.roleId);
		});

		const roleToAssign = role;
		if (!roleToAssign) {
			throw new NotFoundError(`StaffRole with id ${command.roleId} not found`);
		}

		await dataSources.domainDataSource.User.StaffUser.StaffUserUnitOfWork.withScopedTransaction(async (staffUserRepo) => {
			const staffUser = await staffUserRepo.get(command.staffUserId);
			previousRoleId = staffUser.roleId;

			// Build a descriptive activity message including role name, target user and actor (fallback to IDs when names unavailable)
			let actorDisplayName = command.actorStaffUserId;
			try {
				const actor = await staffUserRepo.get(command.actorStaffUserId);
				if (actor?.displayName) actorDisplayName = actor.displayName;
			} catch (e) {
				if (!(e instanceof NotFoundError)) {
					throw e;
				}
			}
			const roleName = roleToAssign.roleName ?? command.roleId;
			const description = `${roleName} assigned by ${actorDisplayName}`;
			staffUser.requestRoleAssignment(roleToAssign, description, command.actorStaffUserId);
			result = await staffUserRepo.save(staffUser);
		});

		if (!result) {
			throw new Error('Unable to assign role to staff user');
		}
		const committedAssignment = result;

		try {
			let roleStillExists = false;
			await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (staffRoleRepo) => {
				roleStillExists = Boolean(await staffRoleRepo.getById(command.roleId));
			});
			if (!roleStillExists) {
				throw new NotFoundError(`StaffRole with id ${command.roleId} not found`);
			}
		} catch (error) {
			const assignmentError = error instanceof NotFoundError ? new NotFoundError(`StaffRole with id ${command.roleId} is no longer available for assignment`) : error;

			try {
				const roleIdToRestore = previousRoleId;
				if (roleIdToRestore) {
					await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (staffRoleRepo) => {
						await staffRoleRepo.getById(roleIdToRestore);
					});
				}

				const systemPassport = Domain.PassportFactory.forSystem({
					canManageStaffRolesAndPermissions: true,
				});
				let rolledBack = false;
				await dataSources.domainDataSource.User.StaffUser.StaffUserUnitOfWork.withTransaction(systemPassport, async (staffUserRepo) => {
					rolledBack = await staffUserRepo.setRoleIfCurrent({
						staffUserId: command.staffUserId,
						expectedCurrentRoleId: command.roleId,
						expectedUpdatedAt: committedAssignment.updatedAt,
						...(roleIdToRestore ? { replacementRoleId: roleIdToRestore } : {}),
						activityType: roleIdToRestore
							? Domain.Contexts.User.StaffUser.StaffUserActivityLogValueObjects.ActivityTypeCodes.RoleAssigned
							: Domain.Contexts.User.StaffUser.StaffUserActivityLogValueObjects.ActivityTypeCodes.RoleRemoved,
						activityDescription: roleIdToRestore ? `Restored previous role after assignment verification failed` : `Removed role after assignment verification failed`,
						activityByStaffUserId: command.actorStaffUserId,
					});
				});
				if (!rolledBack) {
					throw new Error(`Staff user ${command.staffUserId} changed after role assignment and could not be safely restored`);
				}
			} catch (rollbackError) {
				throw new AggregateError([assignmentError, rollbackError], `Role assignment for staff user ${command.staffUserId} committed, verification failed, and compensation did not complete`);
			}

			throw assignmentError;
		}

		return committedAssignment;
	};
};
