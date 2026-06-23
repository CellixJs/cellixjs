import type React from 'react';
import { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { StaffAuthContext } from '@ocom/ui-staff-shared';
import { StaffUserDetailContainer } from '../components/staff-user-detail.container.tsx';
import { StaffUsersListContainer } from '../components/staff-users-list.container.tsx';

export const StaffUsersPage: React.FC = () => {
	const auth = useContext(StaffAuthContext);
	const perms = auth?.permissions;
	const canViewStaffUsers = perms?.canViewStaffUsers === true || perms?.canManageUsers === true || perms?.canManageTechAdmin === true;
	const canViewRoles =
		perms?.canViewRoles === true ||
		perms?.canAddRole === true ||
		perms?.canEditRole === true ||
		perms?.canRemoveRole === true ||
		perms?.canManageStaffRolesAndPermissions === true ||
		perms?.canManageTechAdmin === true;

	if (!canViewStaffUsers) {
		return (
			<Navigate
				to={canViewRoles ? '/staff/user-management/staff-roles' : '/unauthorized'}
				replace
			/>
		);
	}

	return (
		<Routes>
			<Route
				path=""
				element={<StaffUsersListContainer />}
			/>
			<Route
				path=":id"
				element={<StaffUserDetailContainer />}
			/>
		</Routes>
	);
};
