import { StaffAuthContext } from '@ocom/ui-staff-shared';
import type React from 'react';
import { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { StaffRoleCreateContainer } from '../components/staff-role-create.container.tsx';
import { StaffRoleEditContainer } from '../components/staff-role-edit.container.tsx';
import { StaffRolesListContainer } from '../components/staff-roles-list.container.tsx';

export const StaffRolesPage: React.FC = () => {
	const auth = useContext(StaffAuthContext);
	const perms = auth?.permissions;
	const canViewRoles =
		perms?.canViewRoles === true || perms?.canAddRole === true || perms?.canEditRole === true || perms?.canRemoveRole === true || perms?.canManageStaffRolesAndPermissions === true || perms?.canManageTechAdmin === true;
	const canViewStaffUsers = perms?.canViewStaffUsers === true || perms?.canManageUsers === true || perms?.canManageTechAdmin === true;

	if (!canViewRoles) {
		return (
			<Navigate
				to={canViewStaffUsers ? '/staff/user-management/staff-users' : '/unauthorized'}
				replace
			/>
		);
	}

	return (
		<Routes>
			<Route
				path=""
				element={<StaffRolesListContainer />}
			/>
			<Route
				path="create"
				element={<StaffRoleCreateContainer />}
			/>
			<Route
				path="edit/:id"
				element={<StaffRoleEditContainer />}
			/>
		</Routes>
	);
};
