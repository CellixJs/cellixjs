import { useQuery } from '@apollo/client';
import type { FC, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { StaffAuth } from './staff-route-shell.tsx';
import { RequireRoleStaffUserCurrentDocument } from './generated.tsx';

export interface RequireRoleProps {
	/** Deprecated. Frontend authorization must use backend permission flags. */
	roles: readonly string[];
	/** Gate by backend permission flag. */
	permKey?: keyof NonNullable<StaffAuth['permissions']>;
	children: ReactNode;
}

interface StaffUserCurrentQueryResult {
	staffUserCurrent: {
		role?: {
			permissions: {
				communityPermissions: { canManageCommunities: boolean; canManageStaffRolesAndPermissions: boolean };
				userPermissions: { canManageUsers: boolean; canAssignStaffRoles: boolean; canViewStaffUsers: boolean };
				staffRolePermissions: { canViewRoles: boolean; canAddRole: boolean; canEditRole: boolean; canRemoveRole: boolean };
				financePermissions: { canManageFinance: boolean };
				techAdminPermissions: { canManageTechAdmin: boolean };
			};
		};
	};
}

export const RequireRole: FC<RequireRoleProps> = ({ roles, permKey, children }) => {
	void roles;
	const { data, loading, error } = useQuery<StaffUserCurrentQueryResult>(RequireRoleStaffUserCurrentDocument, {
		fetchPolicy: 'cache-first',
	});

	if (loading) {
		return null;
	}

	const rolePermissions = data?.staffUserCurrent?.role?.permissions;
	const permissions: NonNullable<StaffAuth['permissions']> | undefined = rolePermissions
		? {
				canManageCommunities: rolePermissions.communityPermissions.canManageCommunities,
				canManageStaffRolesAndPermissions: rolePermissions.communityPermissions.canManageStaffRolesAndPermissions,
				canManageUsers: rolePermissions.userPermissions.canManageUsers,
				canAssignStaffRoles: rolePermissions.userPermissions.canAssignStaffRoles,
				canViewStaffUsers: rolePermissions.userPermissions.canViewStaffUsers,
				canManageFinance: rolePermissions.financePermissions.canManageFinance,
				canManageTechAdmin: rolePermissions.techAdminPermissions.canManageTechAdmin,
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
