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
						canManageStaffRolesAndPermissions
					}
					userPermissions {
						canManageUsers
						canAssignStaffRoles
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
						canViewDatabaseDocuments
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
				communityPermissions: { canManageCommunities: boolean; canManageStaffRolesAndPermissions: boolean };
				userPermissions: { canManageUsers: boolean; canAssignStaffRoles: boolean; canViewStaffUsers: boolean };
				staffRolePermissions: { canViewRoles: boolean; canAddRole: boolean; canEditRole: boolean; canRemoveRole: boolean };
				financePermissions: { canManageFinance: boolean };
				techAdminPermissions: { canManageTechAdmin: boolean; canViewDatabaseDocuments: boolean };
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
	const canManageTechAdmin = rolePermissions?.techAdminPermissions.canManageTechAdmin ?? false;
	const permissions: NonNullable<StaffAuth['permissions']> | undefined = rolePermissions
		? {
				canManageCommunities: rolePermissions.communityPermissions.canManageCommunities,
				canManageStaffRolesAndPermissions: rolePermissions.communityPermissions.canManageStaffRolesAndPermissions,
				canManageUsers: rolePermissions.userPermissions.canManageUsers,
				canAssignStaffRoles: rolePermissions.userPermissions.canAssignStaffRoles,
				canViewStaffUsers: rolePermissions.userPermissions.canViewStaffUsers,
				canManageFinance: rolePermissions.financePermissions.canManageFinance,
				canManageTechAdmin,
				canViewDatabaseDocuments: rolePermissions.techAdminPermissions.canViewDatabaseDocuments || canManageTechAdmin,
				canViewRoles: rolePermissions.staffRolePermissions.canViewRoles,
				canAddRole: rolePermissions.staffRolePermissions.canAddRole,
				canEditRole: rolePermissions.staffRolePermissions.canEditRole,
				canRemoveRole: rolePermissions.staffRolePermissions.canRemoveRole,
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
