import { gql, useQuery } from '@apollo/client';

const CURRENT_STAFF_USER_QUERY = gql`
	query CurrentStaffUserAndCreateIfNotExists {
		currentStaffUserAndCreateIfNotExists {
			id
			externalId
			firstName
			lastName
			email
			displayName
			role {
				id
				roleName
				enterpriseAppRole
				permissions {
					communityPermissions {
						canManageCommunities
						canManageStaffRolesAndPermissions
					}
					userPermissions {
						canManageUsers
						canAssignStaffRoles
						canAssignStaffUserRoles
						canViewStaffUsers
					}
					staffRolePermissions {
						canViewRoles
						canAddRole
						canEditRole
						canRemoveRole
					}
					financePermissions {
						canManageFinance
					}
					techAdminPermissions {
						canManageTechAdmin
					}
				}
			}
		}
	}
`;

interface StaffPermissions {
	canManageCommunities: boolean;
	canManageStaffRolesAndPermissions: boolean;
	canManageUsers: boolean;
	canAssignStaffRoles: boolean;
	canViewStaffUsers: boolean;
	canManageFinance: boolean;
	canManageTechAdmin: boolean;
	canViewRoles: boolean;
	canAddRole: boolean;
	canEditRole: boolean;
	canRemoveRole: boolean;
}

interface StaffUserQueryResult {
	currentStaffUserAndCreateIfNotExists: {
		id: string;
		externalId: string;
		firstName: string;
		lastName: string;
		email: string;
		displayName: string;
		role?: {
			id: string;
			roleName: string;
			enterpriseAppRole: string;
			permissions: {
				communityPermissions: { canManageCommunities: boolean; canManageStaffRolesAndPermissions: boolean };
				userPermissions: { canManageUsers: boolean; canAssignStaffRoles: boolean; canAssignStaffUserRoles: boolean; canViewStaffUsers: boolean };
				staffRolePermissions: { canViewRoles: boolean; canAddRole: boolean; canEditRole: boolean; canRemoveRole: boolean };
				financePermissions: { canManageFinance: boolean };
				techAdminPermissions: { canManageTechAdmin: boolean };
			};
		};
	};
}

export const useStaffPermissions = (): { permissions: StaffPermissions | undefined; enterpriseAppRole: string | undefined; user: { id?: string; displayName?: string; firstName?: string; lastName?: string; email?: string } | undefined; loading: boolean; error: Error | undefined } => {
	const { data, loading, error } = useQuery<StaffUserQueryResult>(CURRENT_STAFF_USER_QUERY, {
		fetchPolicy: 'cache-first',
	});

	const rolePermissions = data?.currentStaffUserAndCreateIfNotExists?.role?.permissions;
	const currentUser = data?.currentStaffUserAndCreateIfNotExists;

	// Treat a TechAdmin as an implicit manager of all sections
	const isTechAdmin = rolePermissions?.techAdminPermissions?.canManageTechAdmin ?? false;

	const permissions: StaffPermissions | undefined = rolePermissions
		? {
				canManageCommunities: rolePermissions.communityPermissions.canManageCommunities || isTechAdmin,
				canManageStaffRolesAndPermissions: rolePermissions.communityPermissions.canManageStaffRolesAndPermissions || isTechAdmin,
				canManageUsers: rolePermissions.userPermissions.canManageUsers || isTechAdmin,
				canAssignStaffRoles: rolePermissions.userPermissions.canAssignStaffRoles || rolePermissions.userPermissions.canAssignStaffUserRoles || isTechAdmin,
				canViewStaffUsers: rolePermissions.userPermissions.canViewStaffUsers || rolePermissions.userPermissions.canManageUsers || isTechAdmin,
				canManageFinance: rolePermissions.financePermissions.canManageFinance || isTechAdmin,
				canManageTechAdmin: isTechAdmin,
				canViewRoles: rolePermissions.staffRolePermissions.canViewRoles || rolePermissions.communityPermissions.canManageStaffRolesAndPermissions || isTechAdmin,
				canAddRole: rolePermissions.staffRolePermissions.canAddRole || rolePermissions.communityPermissions.canManageStaffRolesAndPermissions || isTechAdmin,
				canEditRole: rolePermissions.staffRolePermissions.canEditRole || rolePermissions.communityPermissions.canManageStaffRolesAndPermissions || isTechAdmin,
				canRemoveRole: rolePermissions.staffRolePermissions.canRemoveRole || rolePermissions.communityPermissions.canManageStaffRolesAndPermissions || isTechAdmin,
			}
		: undefined;

	return {
		permissions,
		enterpriseAppRole: data?.currentStaffUserAndCreateIfNotExists?.role?.enterpriseAppRole,
		user: currentUser
			? {
					id: currentUser.id,
					displayName: currentUser.displayName,
					firstName: currentUser.firstName,
					lastName: currentUser.lastName,
					email: currentUser.email,
				}
			: undefined,
		loading,
		error,
	};
};
