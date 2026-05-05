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
					sectionPermissions {
						canManageCommunities
						canManageUser
						canManageFinance
						canManageTechAdmin
					}
				}
			}
		}
	}
`;

interface StaffPermissions {
	canManageCommunities: boolean;
	canManageUser: boolean;
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
				sectionPermissions: StaffPermissions;
			};
		};
	};
}

export const useStaffPermissions = (): { permissions: StaffPermissions | undefined; loading: boolean; error: Error | undefined } => {
	const { data, loading, error } = useQuery<StaffUserQueryResult>(CURRENT_STAFF_USER_QUERY, {
		fetchPolicy: 'cache-first',
	});

	const sectionPermissions = data?.currentStaffUserAndCreateIfNotExists?.role?.permissions?.sectionPermissions;

	return {
		permissions: sectionPermissions ?? undefined,
		loading,
		error,
	};
};
