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
				permissions {
					communityPermissions {
						canManageCommunities
					}
					userPermissions {
						canManageUsers
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
			permissions: {
				communityPermissions: { canManageCommunities: boolean };
				userPermissions: { canManageUsers: boolean };
				financePermissions: { canManageFinance: boolean };
				techAdminPermissions: { canManageTechAdmin: boolean };
			};
		};
	};
}

export const useStaffPermissions = (): { permissions: StaffPermissions | undefined; loading: boolean; error: Error | undefined } => {
	const { data, loading, error } = useQuery<StaffUserQueryResult>(CURRENT_STAFF_USER_QUERY, {
		fetchPolicy: 'cache-first',
	});

	const rolePermissions = data?.currentStaffUserAndCreateIfNotExists?.role?.permissions;
 
	// Treat a TechAdmin as an implicit manager of all sections
	const isTechAdmin = rolePermissions?.techAdminPermissions?.canManageTechAdmin ?? false;
 
	const permissions: StaffPermissions | undefined = rolePermissions
		? {
				canManageCommunities: rolePermissions.communityPermissions.canManageCommunities || isTechAdmin,
				canManageUsers: rolePermissions.userPermissions.canManageUsers || isTechAdmin,
				canManageFinance: rolePermissions.financePermissions.canManageFinance || isTechAdmin,
				canManageTechAdmin: isTechAdmin,
			}
		: undefined;

	return {
		permissions,
		loading,
		error,
	};
};
