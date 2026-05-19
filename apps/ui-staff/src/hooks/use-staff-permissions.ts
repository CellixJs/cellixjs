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
					}
					userPermissions {
						canManageUsers
						canAssignStaffUserRoles
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
	canManageUsers: boolean;
	canManageFinance: boolean;
	canManageTechAdmin: boolean;
	canAssignStaffUserRoles: boolean;
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
				communityPermissions: { canManageCommunities: boolean };
				userPermissions: { canManageUsers: boolean; canAssignStaffUserRoles: boolean };
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
	const currentUser = data?.currentStaffUserAndCreateIfNotExists
  
	// Treat a TechAdmin as an implicit manager of all sections
	const isTechAdmin = rolePermissions?.techAdminPermissions?.canManageTechAdmin ?? false;
  
	const permissions: StaffPermissions | undefined = rolePermissions
		? {
				canManageCommunities: rolePermissions.communityPermissions.canManageCommunities || isTechAdmin,
				canManageUsers: rolePermissions.userPermissions.canManageUsers || isTechAdmin,
				canManageFinance: rolePermissions.financePermissions.canManageFinance || isTechAdmin,
				canManageTechAdmin: isTechAdmin,
				canAssignStaffUserRoles: rolePermissions.userPermissions.canAssignStaffUserRoles || isTechAdmin,
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
