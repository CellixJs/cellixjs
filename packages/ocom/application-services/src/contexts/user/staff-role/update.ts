import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { applyCommunityPermissions, applyUserPermissions, applyRolePermissions, applyFinancePermissions, applyTechAdminPermissions } from './apply-permissions.ts';
import type { StaffRoleCommandPermissions } from './apply-permissions.ts';

export interface StaffRoleUpdateCommand {
	roleId: string;
	roleName: string | undefined;
	enterpriseAppRole?: string;
	permissions?: StaffRoleCommandPermissions;
}

export const update = (dataSources: DataSources) => {
	return async (command: StaffRoleUpdateCommand): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference> => {
		let updatedRole: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;

		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repository) => {
			const staffRole = await repository.getById(command.roleId);
			if (command.roleName !== undefined) {
				staffRole.roleName = command.roleName;
			}
			if (command.enterpriseAppRole) {
				staffRole.enterpriseAppRole = command.enterpriseAppRole;
			}
			applyCommunityPermissions(staffRole, command.permissions?.community);
			applyUserPermissions(staffRole, command.permissions?.user);
			applyRolePermissions(staffRole, command.permissions?.staffRole);
			applyFinancePermissions(staffRole, command.permissions?.finance);
			applyTechAdminPermissions(staffRole, command.permissions?.techAdmin);
			updatedRole = await repository.save(staffRole);
		});

		if (!updatedRole) {
			throw new Error('Unable to update staff role');
		}

		return updatedRole;
	};
};
