import type { Domain } from '@ocom/domain';

export interface StaffRoleCommandCommunityPermissions {
	canManageCommunities?: boolean;
	canManageStaffRolesAndPermissions?: boolean;
	canManageAllCommunities?: boolean;
	canDeleteCommunities?: boolean;
	canChangeCommunityOwner?: boolean;
	canReIndexSearchCollections?: boolean;
}

export interface StaffRoleCommandUserPermissions {
	canManageUsers?: boolean;
	canAssignStaffRoles?: boolean;
	canViewStaffUsers?: boolean;
}

export interface StaffRoleCommandRolePermissions {
	canViewRoles?: boolean;
	canAddRole?: boolean;
	canEditRole?: boolean;
	canRemoveRole?: boolean;
}

export interface StaffRoleCommandFinancePermissions {
	canManageFinance?: boolean;
	canViewGLBatchSummaries?: boolean;
	canViewFinanceConfigs?: boolean;
	canCreateFinanceConfigs?: boolean;
}

export interface StaffRoleCommandTechAdminPermissions {
	canManageTechAdmin?: boolean;
	canViewDatabaseExplorer?: boolean;
	canViewBlobExplorer?: boolean;
	canViewQueueDashboard?: boolean;
	canSendQueueMessages?: boolean;
}

export interface StaffRoleCommandPermissions {
	community?: StaffRoleCommandCommunityPermissions;
	user?: StaffRoleCommandUserPermissions;
	staffRole?: StaffRoleCommandRolePermissions;
	finance?: StaffRoleCommandFinancePermissions;
	techAdmin?: StaffRoleCommandTechAdminPermissions;
}

const PERMISSION_FLAG_GROUPS = [
	{
		commandKey: 'community',
		domainKey: 'communityPermissions',
		flags: ['canManageCommunities', 'canManageStaffRolesAndPermissions', 'canManageAllCommunities', 'canDeleteCommunities', 'canChangeCommunityOwner', 'canReIndexSearchCollections'],
	},
	{ commandKey: 'user', domainKey: 'userPermissions', flags: ['canManageUsers', 'canAssignStaffRoles', 'canViewStaffUsers'] },
	{ commandKey: 'staffRole', domainKey: 'staffRolePermissions', flags: ['canViewRoles', 'canAddRole', 'canEditRole', 'canRemoveRole'] },
	{ commandKey: 'finance', domainKey: 'financePermissions', flags: ['canManageFinance', 'canViewGLBatchSummaries', 'canViewFinanceConfigs', 'canCreateFinanceConfigs'] },
	{ commandKey: 'techAdmin', domainKey: 'techAdminPermissions', flags: ['canManageTechAdmin', 'canViewDatabaseExplorer', 'canViewBlobExplorer', 'canViewQueueDashboard', 'canSendQueueMessages'] },
] as const;

/**
 * Returns the first permission flag the command would newly grant that is not
 * in the caller's grantable set. Flags the persisted role already holds pass
 * through (full-payload re-saves keep working) and false values are always
 * allowed (revocations). Evaluating against the aggregate fetched inside the
 * unit of work binds the decision to the same snapshot that gets mutated, so
 * a concurrent role change cannot bypass the gate (TOCTOU).
 */
export const findForbiddenPermissionGrant = (
	staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>,
	permissions: StaffRoleCommandPermissions | undefined,
	grantablePermissionFlags: readonly string[],
): string | undefined => {
	if (!permissions) {
		return undefined;
	}
	const grantable = new Set(grantablePermissionFlags);
	const currentPermissions = staffRole.permissions as unknown as Record<string, Record<string, unknown> | undefined>;
	for (const group of PERMISSION_FLAG_GROUPS) {
		const requestedGroup = permissions[group.commandKey] as Record<string, unknown> | undefined;
		if (!requestedGroup) {
			continue;
		}
		const currentGroup = currentPermissions?.[group.domainKey];
		for (const flag of group.flags) {
			if (requestedGroup[flag] !== true) {
				continue;
			}
			if (grantable.has(flag)) {
				continue;
			}
			if (currentGroup?.[flag] === true) {
				continue;
			}
			return flag;
		}
	}
	return undefined;
};

export const applyCommunityPermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, permissions?: StaffRoleCommandCommunityPermissions) => {
	if (!permissions) return;
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

export const applyUserPermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, permissions?: StaffRoleCommandUserPermissions) => {
	if (!permissions) return;
	const { userPermissions } = staffRole.permissions;
	if (permissions.canManageUsers !== undefined) {
		userPermissions.canManageUsers = permissions.canManageUsers;
	}
	if (permissions.canAssignStaffRoles !== undefined) {
		userPermissions.canAssignStaffRoles = permissions.canAssignStaffRoles;
	}
	if (permissions.canViewStaffUsers !== undefined) {
		userPermissions.canViewStaffUsers = permissions.canViewStaffUsers;
	}
};

export const applyRolePermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, permissions?: StaffRoleCommandRolePermissions) => {
	if (!permissions) return;
	const { staffRolePermissions } = staffRole.permissions;
	if (permissions.canViewRoles !== undefined) {
		staffRolePermissions.canViewRoles = permissions.canViewRoles;
	}
	if (permissions.canAddRole !== undefined) {
		staffRolePermissions.canAddRole = permissions.canAddRole;
	}
	if (permissions.canEditRole !== undefined) {
		staffRolePermissions.canEditRole = permissions.canEditRole;
	}
	if (permissions.canRemoveRole !== undefined) {
		staffRolePermissions.canRemoveRole = permissions.canRemoveRole;
	}
};

export const applyFinancePermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, permissions?: StaffRoleCommandFinancePermissions) => {
	if (!permissions) return;
	const { financePermissions } = staffRole.permissions;
	if (permissions.canManageFinance !== undefined) {
		financePermissions.canManageFinance = permissions.canManageFinance;
	}
	if (permissions.canViewGLBatchSummaries !== undefined) {
		financePermissions.canViewGLBatchSummaries = permissions.canViewGLBatchSummaries;
	}
	if (permissions.canViewFinanceConfigs !== undefined) {
		financePermissions.canViewFinanceConfigs = permissions.canViewFinanceConfigs;
	}
	if (permissions.canCreateFinanceConfigs !== undefined) {
		financePermissions.canCreateFinanceConfigs = permissions.canCreateFinanceConfigs;
	}
};

export const applyTechAdminPermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, permissions?: StaffRoleCommandTechAdminPermissions) => {
	if (!permissions) return;
	const { techAdminPermissions } = staffRole.permissions;
	if (permissions.canManageTechAdmin !== undefined) {
		techAdminPermissions.canManageTechAdmin = permissions.canManageTechAdmin;
	}
	if (permissions.canViewDatabaseExplorer !== undefined) {
		techAdminPermissions.canViewDatabaseExplorer = permissions.canViewDatabaseExplorer;
	}
	if (permissions.canViewBlobExplorer !== undefined) {
		techAdminPermissions.canViewBlobExplorer = permissions.canViewBlobExplorer;
	}
	if (permissions.canViewQueueDashboard !== undefined) {
		techAdminPermissions.canViewQueueDashboard = permissions.canViewQueueDashboard;
	}
	if (permissions.canSendQueueMessages !== undefined) {
		techAdminPermissions.canSendQueueMessages = permissions.canSendQueueMessages;
	}
};
