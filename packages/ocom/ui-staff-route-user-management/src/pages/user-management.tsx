import { SafetyOutlined, UserOutlined } from '@ant-design/icons';
import { StaffAuthContext, SubPageLayout, VerticalTabs } from '@ocom/ui-staff-shared';
import type React from 'react';
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { StaffRolesPage } from './staff-roles.tsx';
import { StaffUsersPage } from './staff-users.tsx';

export const UserManagementPage: React.FC = () => {
	const auth = useContext(StaffAuthContext);
	const perms = auth?.permissions;
	const canViewStaffUsers = perms?.canViewStaffUsers === true || perms?.canManageUsers === true || perms?.canManageStaffRolesAndPermissions === true || perms?.canManageTechAdmin === true;
	const canViewRoles =
		perms?.canViewRoles === true || perms?.canAddRole === true || perms?.canEditRole === true || perms?.canRemoveRole === true || perms?.canManageStaffRolesAndPermissions === true || perms?.canManageTechAdmin === true;

	const pages = [
		...(canViewStaffUsers
			? [
					{
						id: 'staff-users',
						link: 'staff-users',
						path: 'staff-users/*',
						title: 'Staff Users',
						icon: <UserOutlined />,
						element: <StaffUsersPage />,
					},
				]
			: []),
		...(canViewRoles
			? [
					{
						id: 'staff-roles',
						link: 'staff-roles',
						path: 'staff-roles/*',
						title: 'Staff Roles',
						icon: <SafetyOutlined />,
						element: <StaffRolesPage />,
					},
				]
			: []),
	];

	if (pages.length === 0) {
		return (
			<Navigate
				to="/unauthorized"
				replace
			/>
		);
	}

	return (
		<SubPageLayout
			fixedHeader={false}
			header={<div style={{ padding: '16px 24px', fontWeight: 700, fontSize: 18 }}>User Management</div>}
		>
			<VerticalTabs pages={pages} />
		</SubPageLayout>
	);
};
