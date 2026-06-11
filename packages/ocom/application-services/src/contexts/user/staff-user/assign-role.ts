import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface StaffUserAssignRoleCommand {
	staffUserId: string;
	roleId: string;
	actorStaffUserId: string;
}

export const assignRole = (dataSources: DataSources) => {
	return async (command: StaffUserAssignRoleCommand): Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference> => {
		let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;

		await dataSources.domainDataSource.User.StaffUser.StaffUserUnitOfWork.withScopedTransaction(async (staffUserRepo) => {
			const staffUser = await staffUserRepo.get(command.staffUserId);

			let role: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null = null;
			await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (staffRoleRepo) => {
				role = await staffRoleRepo.getById(command.roleId);
			});

			if (!role) {
				throw new Error(`StaffRole with id ${command.roleId} not found`);
			}

			// Build a descriptive activity message including role name, target user and actor (fallback to IDs when names unavailable)
			let actorDisplayName = command.actorStaffUserId;
			try {
				const actor = await staffUserRepo.get(command.actorStaffUserId);
				if (actor?.displayName) actorDisplayName = actor.displayName;
			} catch (_e) {
				// ignore - use id fallback
			}
			const roleName = (role as unknown as { roleName?: string })?.roleName ?? command.roleId;
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
