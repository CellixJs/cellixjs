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
