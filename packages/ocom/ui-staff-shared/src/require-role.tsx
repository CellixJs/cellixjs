import { gql, useQuery } from '@apollo/client';
import type { FC, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { StaffAuth } from './staff-route-shell.tsx';

export interface RequireRoleProps {
	/** Deprecated. Frontend authorization must use backend permission flags. */
	roles: readonly string[];
	/** Gate by backend permission flag. */
	permKey?: keyof NonNullable<StaffAuth['permissions']>;
	children: ReactNode;
}

const STAFF_USER_CURRENT_QUERY = gql`
	query RequireRoleStaffUserCurrent {
		staffUserCurrent: currentStaffUserAndCreateIfNotExists {
			role {
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

interface StaffUserCurrentQueryResult {
	staffUserCurrent: {
		role?: {
			permissions: {
				communityPermissions: { canManageCommunities: boolean };
				userPermissions: { canManageUsers: boolean };
				financePermissions: { canManageFinance: boolean };
				techAdminPermissions: { canManageTechAdmin: boolean };
			};
		};
	};
}

export const RequireRole: FC<RequireRoleProps> = ({ roles, permKey, children }) => {
	void roles;
	const { data, loading, error } = useQuery<StaffUserCurrentQueryResult>(STAFF_USER_CURRENT_QUERY, {
		fetchPolicy: 'cache-first',
	});

	if (loading) {
		return null;
	}

	const rolePermissions = data?.staffUserCurrent?.role?.permissions;
	const permissions: NonNullable<StaffAuth['permissions']> | undefined = rolePermissions
		? {
				canManageCommunities: rolePermissions.communityPermissions.canManageCommunities,
				canManageUsers: rolePermissions.userPermissions.canManageUsers,
				canManageFinance: rolePermissions.financePermissions.canManageFinance,
				canManageTechAdmin: rolePermissions.techAdminPermissions.canManageTechAdmin,
			}
		: undefined;
	const isAuthorized = permKey !== undefined && permissions?.[permKey] === true;

	if (error || !isAuthorized) {
		return (
			<Navigate
				to="/unauthorized"
				replace
			/>
		);
	}

	return <>{children}</>;
};
