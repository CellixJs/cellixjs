import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

interface StaffRoleCreateCommandCommunityPermissions {
	canManageCommunities?: boolean;
	canManageStaffRolesAndPermissions?: boolean;
	canManageAllCommunities?: boolean;
	canDeleteCommunities?: boolean;
	canChangeCommunityOwner?: boolean;
	canReIndexSearchCollections?: boolean;
}

interface StaffRoleCreateCommandUserPermissions {
	canManageUsers?: boolean;
	canAssignStaffUserRoles?: boolean;
}

export interface StaffRoleCreateCommandPermissions {
	community?: StaffRoleCreateCommandCommunityPermissions;
	user?: StaffRoleCreateCommandUserPermissions;
}

export interface StaffRoleCreateCommand {
	roleName: string;
	enterpriseAppRole?: string;
	isDefault?: boolean;
	permissions?: StaffRoleCreateCommandPermissions;
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

const applyCommunityPermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, permissions?: StaffRoleCreateCommandCommunityPermissions) => {
	if (!permissions) {
		return;
	}

	const { communityPermissions } = staffRole.permissions;

	if (permissions.canManageCommunities !== undefined) {
		communityPermissions.canManageCommunities = permissions.canManageCommunities;
	}
	if (permissions.canManageStaffRolesAndPermissions !== undefined) {
		communityPermissions.canManageStaffRolesAndPermissions = permissions.canManageStaffRolesAndPermissions;
	}
	if (permissions.canManageAllCommunities !== undefined) {
		communityPermissions.canManageAllCommunities = permissions.canManageAllCommunities;
	}
	if (permissions.canDeleteCommunities !== undefined) {
		communityPermissions.canDeleteCommunities = permissions.canDeleteCommunities;
	}
	if (permissions.canChangeCommunityOwner !== undefined) {
		communityPermissions.canChangeCommunityOwner = permissions.canChangeCommunityOwner;
	}
	if (permissions.canReIndexSearchCollections !== undefined) {
		communityPermissions.canReIndexSearchCollections = permissions.canReIndexSearchCollections;
	}
};

const applyUserPermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, permissions?: StaffRoleCreateCommandUserPermissions) => {
	if (!permissions) {
		return;
	}

	const { userPermissions } = staffRole.permissions;

	if (permissions.canManageUsers !== undefined) {
		userPermissions.canManageUsers = permissions.canManageUsers;
	}
	if (permissions.canAssignStaffUserRoles !== undefined) {
		userPermissions.canAssignStaffUserRoles = permissions.canAssignStaffUserRoles;
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
			createdRole = await repository.save(staffRole);
		});

		if (!createdRole) {
			throw new Error('Unable to create staff role');
		}

		return createdRole;
	};
};
