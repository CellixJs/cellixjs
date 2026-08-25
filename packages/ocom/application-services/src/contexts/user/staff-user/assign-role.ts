import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

/**
 * Caller allowances computed at the API boundary (from the verified JWT's
 * enterprise app roles). The tier gate runs against the same role snapshot
 * that gets assigned, so a concurrent role promotion cannot slip past a
 * stale resolver-side pre-check.
 */
export interface StaffUserAssignRoleCallerContext {
	/** Enterprise app role tiers whose roles the caller may assign. */
	allowedEnterpriseAppRoles: string[];
	/** Whether the caller may assign any role, including unclassified ones. */
	canAssignAnyRole: boolean;
}

export interface StaffUserAssignRoleCommand {
	staffUserId: string;
	roleId: string;
	actorStaffUserId: string;
	callerContext: StaffUserAssignRoleCallerContext;
}

export const assignRole = (dataSources: DataSources) => {
	return async (command: StaffUserAssignRoleCommand): Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference> => {
		let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;

		await dataSources.domainDataSource.User.StaffUser.StaffUserUnitOfWork.withScopedTransaction(async (staffUserRepo) => {
			const staffUser = await staffUserRepo.get(command.staffUserId);

			let role!: Domain.Contexts.User.StaffRole.StaffRoleEntityReference;
			await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (staffRoleRepo) => {
				let foundRole: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null;
				try {
					foundRole = await staffRoleRepo.getById(command.roleId);
				} catch (error) {
					if ((error as Error)?.name === 'NotFoundError') {
						return;
					}
					throw error;
				}
				if (!foundRole) {
					return;
				}
				role = foundRole;
			});

			if (!role) {
				throw new Error(`StaffRole with id ${command.roleId} not found`);
			}

			// Validate the tier on the exact snapshot assigned below: missing
			// classifications fail closed so unclassified roles with elevated
			// permissions cannot be assigned by lower tiers.
			if (!command.callerContext.canAssignAnyRole) {
				const targetAppRole = (role.enterpriseAppRole ?? '').trim();
				if (!targetAppRole) {
					throw new Error('You do not have permission to assign a role without an enterprise app role type');
				}
				if (!command.callerContext.allowedEnterpriseAppRoles.includes(targetAppRole)) {
					throw new Error(`You do not have permission to assign a role with enterprise app role type: ${targetAppRole}`);
				}
			}

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

		return result;
	};
};
