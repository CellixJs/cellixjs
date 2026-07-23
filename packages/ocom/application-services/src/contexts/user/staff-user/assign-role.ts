import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface StaffUserAssignRoleCommand {
	staffUserId: string;
	roleId: string;
	actorStaffUserId: string;
}

const isNotFoundError = (error: unknown): boolean => error instanceof Error && (error.name === 'NotFoundError' || error.message.toLowerCase().includes('not found'));

export const assignRole = (dataSources: DataSources) => {
	return async (command: StaffUserAssignRoleCommand): Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference> => {
		let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;
		let role: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;

		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (staffRoleRepo) => {
			role = await staffRoleRepo.getById(command.roleId);
		});

		const roleToAssign = role;
		if (!roleToAssign) {
			throw new Error(`StaffRole with id ${command.roleId} not found`);
		}

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
			const roleName = roleToAssign.roleName ?? command.roleId;
			const description = `${roleName} assigned by ${actorDisplayName}`;
			staffUser.requestRoleAssignment(roleToAssign, description, command.actorStaffUserId);
			result = await staffUserRepo.save(staffUser);
		});

		if (!result) {
			throw new Error('Unable to assign role to staff user');
		}

		try {
			let roleStillExists = false;
			await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (staffRoleRepo) => {
				roleStillExists = Boolean(await staffRoleRepo.getById(command.roleId));
			});
			if (!roleStillExists) {
				throw new Error(`StaffRole with id ${command.roleId} not found`);
			}
		} catch (error) {
			if (!isNotFoundError(error)) {
				throw error;
			}
			await Domain.Services.User.StaffRoleDeletedReassignmentService.reassignStaffUsersToDefaultRole(command.roleId, roleToAssign.enterpriseAppRole, command.actorStaffUserId, dataSources.domainDataSource);
			const unavailableRoleError = new Error(`StaffRole with id ${command.roleId} is no longer available for assignment`);
			unavailableRoleError.name = 'NotFoundError';
			throw unavailableRoleError;
		}

		return result;
	};
};
