import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

interface StaffRoleUpdateCommandCommunityPermissions {
	canManageCommunities?: boolean;
	canManageStaffRolesAndPermissions?: boolean;
	canManageAllCommunities?: boolean;
	canDeleteCommunities?: boolean;
	canChangeCommunityOwner?: boolean;
	canReIndexSearchCollections?: boolean;
}

interface StaffRoleUpdateCommandUserPermissions {
	canManageUsers?: boolean;
	canAssignStaffUserRoles?: boolean;
}

interface StaffRoleUpdateCommandPermissions {
	community?: StaffRoleUpdateCommandCommunityPermissions;
	user?: StaffRoleUpdateCommandUserPermissions;
}

export interface StaffRoleUpdateCommand {
	roleId: string;
	roleName: string;
	enterpriseAppRole?: string;
	permissions?: StaffRoleUpdateCommandPermissions;
}

const applyCommunityPermissions = (
	staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>,
	permissions?: StaffRoleUpdateCommandCommunityPermissions,
) => {
	if (!permissions) return;
	const { communityPermissions } = staffRole.permissions;
	if (permissions.canManageCommunities !== undefined) communityPermissions.canManageCommunities = permissions.canManageCommunities;
	if (permissions.canManageStaffRolesAndPermissions !== undefined) communityPermissions.canManageStaffRolesAndPermissions = permissions.canManageStaffRolesAndPermissions;
	if (permissions.canManageAllCommunities !== undefined) communityPermissions.canManageAllCommunities = permissions.canManageAllCommunities;
	if (permissions.canDeleteCommunities !== undefined) communityPermissions.canDeleteCommunities = permissions.canDeleteCommunities;
	if (permissions.canChangeCommunityOwner !== undefined) communityPermissions.canChangeCommunityOwner = permissions.canChangeCommunityOwner;
	if (permissions.canReIndexSearchCollections !== undefined) communityPermissions.canReIndexSearchCollections = permissions.canReIndexSearchCollections;
};

const applyUserPermissions = (
	staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>,
	permissions?: StaffRoleUpdateCommandUserPermissions,
) => {
	if (!permissions) return;
	const { userPermissions } = staffRole.permissions;
	if (permissions.canManageUsers !== undefined) userPermissions.canManageUsers = permissions.canManageUsers;
	if (permissions.canAssignStaffUserRoles !== undefined) userPermissions.canAssignStaffUserRoles = permissions.canAssignStaffUserRoles;
};

export const update = (dataSources: DataSources) => {
	return async (command: StaffRoleUpdateCommand): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference> => {
		let updatedRole: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;

		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repository) => {
			const staffRole = await repository.getById(command.roleId);
			staffRole.roleName = command.roleName;
			if (command.enterpriseAppRole) {
				staffRole.enterpriseAppRole = command.enterpriseAppRole;
			}
			applyCommunityPermissions(staffRole, command.permissions?.community);
			applyUserPermissions(staffRole, command.permissions?.user);
			updatedRole = await repository.save(staffRole);
		});

		if (!updatedRole) {
			throw new Error('Unable to update staff role');
		}

		return updatedRole;
	};
};
