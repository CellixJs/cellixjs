import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { applyCommunityPermissions, applyUserPermissions, applyRolePermissions, applyFinancePermissions, applyTechAdminPermissions } from './apply-permissions.ts';
import type { StaffRoleCommandPermissions } from './apply-permissions.ts';

export interface StaffRoleCreateCommand {
	roleName: string;
	enterpriseAppRole?: string;
	isDefault?: boolean;
	permissions?: StaffRoleCommandPermissions;
}

const isNotFoundError = (error: unknown): boolean => {
	return error instanceof Error && (error.name === 'NotFoundError' || error.message.toLowerCase().includes('not found'));
};

const ensureRoleDoesNotExist = async (repository: Domain.Contexts.User.StaffRole.StaffRoleRepository<Domain.Contexts.User.StaffRole.StaffRoleProps>, roleName: string): Promise<void> => {
	try {
		await repository.getByRoleName(roleName);
		throw new Error(`Staff role with name ${roleName} already exists`);
	} catch (error) {
		if (isNotFoundError(error)) {
			return;
		}
		throw error;
	}
};

export const create = (dataSources: DataSources) => {
	return async (command: StaffRoleCreateCommand): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference> => {
		let createdRole: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;

		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repository) => {
			await ensureRoleDoesNotExist(repository, command.roleName);

			const staffRole = await repository.getNewInstance(command.roleName);
			if (command.enterpriseAppRole) {
				staffRole.enterpriseAppRole = command.enterpriseAppRole;
			}
			applyCommunityPermissions(staffRole, command.permissions?.community);
			applyUserPermissions(staffRole, command.permissions?.user);
			applyRolePermissions(staffRole, command.permissions?.staffRole);
			applyFinancePermissions(staffRole, command.permissions?.finance);
			applyTechAdminPermissions(staffRole, command.permissions?.techAdmin);
			createdRole = await repository.save(staffRole);
		});

		if (!createdRole) {
			throw new Error('Unable to create staff role');
		}

		return createdRole;
	};
};
