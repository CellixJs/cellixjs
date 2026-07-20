/** GraphQL permission groups exposed on the StaffRole type. */
type StaffRolePermissionGroupName = 'communityPermissions' | 'financePermissions' | 'staffRolePermissions' | 'techAdminPermissions' | 'userPermissions';

/** Staff role shape returned by the staff-role queries and mutations. */
export interface StaffRoleResult {
	id: string;
	roleName: string;
	enterpriseAppRole: string;
	isDefault: boolean;
	permissions: Record<StaffRolePermissionGroupName, Record<string, boolean>>;
}

/** Staff user shape returned by the staff-user queries and mutations. */
export interface StaffUserResult {
	id: string;
	displayName: string;
	externalId: string;
	role: { id: string; roleName: string } | null;
}

/** Status block returned by staff-role and staff-user mutations. */
export interface MutationStatus {
	success: boolean;
	errorMessage?: string | null;
}

/** Maps flat permission command keys to their GraphQL permission group. */
export const STAFF_ROLE_PERMISSION_GROUP_BY_KEY: Record<string, StaffRolePermissionGroupName> = {
	canManageCommunities: 'communityPermissions',
	canManageStaffRolesAndPermissions: 'communityPermissions',
	canManageAllCommunities: 'communityPermissions',
	canDeleteCommunities: 'communityPermissions',
	canChangeCommunityOwner: 'communityPermissions',
	canReIndexSearchCollections: 'communityPermissions',
	canManageFinance: 'financePermissions',
	canViewGLBatchSummaries: 'financePermissions',
	canViewFinanceConfigs: 'financePermissions',
	canCreateFinanceConfigs: 'financePermissions',
	canViewRoles: 'staffRolePermissions',
	canAddRole: 'staffRolePermissions',
	canEditRole: 'staffRolePermissions',
	canRemoveRole: 'staffRolePermissions',
	canManageTechAdmin: 'techAdminPermissions',
	canViewDatabaseExplorer: 'techAdminPermissions',
	canViewBlobExplorer: 'techAdminPermissions',
	canViewQueueDashboard: 'techAdminPermissions',
	canSendQueueMessages: 'techAdminPermissions',
	canManageUsers: 'userPermissions',
	canAssignStaffRoles: 'userPermissions',
	canViewStaffUsers: 'userPermissions',
};

/** Convert flat `key -> boolean` pairs into the grouped StaffRole permissions input shape. */
export function toPermissionsInput(flatPermissions: Record<string, boolean>): Record<string, Record<string, boolean>> {
	const input: Record<string, Record<string, boolean>> = {};
	for (const [key, value] of Object.entries(flatPermissions)) {
		const group = STAFF_ROLE_PERMISSION_GROUP_BY_KEY[key];
		if (!group) {
			throw new Error(`Unknown staff role permission "${key}"`);
		}
		input[group] = { ...input[group], [key]: value };
	}
	return input;
}

const STAFF_ROLE_FIELDS = `
	id
	roleName
	enterpriseAppRole
	isDefault
	permissions {
		communityPermissions {
			canManageCommunities
			canManageStaffRolesAndPermissions
			canManageAllCommunities
			canDeleteCommunities
			canChangeCommunityOwner
			canReIndexSearchCollections
		}
		financePermissions {
			canManageFinance
			canViewGLBatchSummaries
			canViewFinanceConfigs
			canCreateFinanceConfigs
		}
		staffRolePermissions {
			canViewRoles
			canAddRole
			canEditRole
			canRemoveRole
		}
		techAdminPermissions {
			canManageTechAdmin
			canViewDatabaseExplorer
			canViewBlobExplorer
			canViewQueueDashboard
			canSendQueueMessages
		}
		userPermissions {
			canManageUsers
			canAssignStaffRoles
			canViewStaffUsers
		}
	}
	createdAt
	updatedAt
`;

export const STAFF_ROLES_QUERY = `
	query StaffRoles {
		staffRoles {
			${STAFF_ROLE_FIELDS}
		}
	}
`;

export const STAFF_ROLE_BY_ID_QUERY = `
	query StaffRoleById($id: ObjectID!) {
		staffRoleById(id: $id) {
			${STAFF_ROLE_FIELDS}
		}
	}
`;

export const STAFF_ROLE_CREATE_MUTATION = `
	mutation StaffRoleCreate($input: StaffRoleCreateInput!) {
		staffRoleCreate(input: $input) {
			status {
				success
				errorMessage
			}
			staffRole {
				${STAFF_ROLE_FIELDS}
			}
		}
	}
`;

export const STAFF_ROLE_UPDATE_MUTATION = `
	mutation StaffRoleUpdate($input: StaffRoleUpdateInput!) {
		staffRoleUpdate(input: $input) {
			status {
				success
				errorMessage
			}
			staffRole {
				${STAFF_ROLE_FIELDS}
			}
		}
	}
`;

export const STAFF_USERS_QUERY = `
	query StaffUsers {
		staffUsers {
			id
			displayName
			externalId
			role {
				id
				roleName
			}
		}
	}
`;

export const STAFF_USER_ASSIGN_ROLE_MUTATION = `
	mutation StaffUserAssignRole($input: StaffUserAssignRoleInput!) {
		staffUserAssignRole(input: $input) {
			status {
				success
				errorMessage
			}
			staffUser {
				id
				displayName
				role {
					id
					roleName
				}
			}
		}
	}
`;
