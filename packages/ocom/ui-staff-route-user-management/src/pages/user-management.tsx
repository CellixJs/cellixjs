import { SafetyOutlined, UserOutlined } from '@ant-design/icons';
import { SubPageLayout, VerticalTabs } from '@ocom/ui-staff-shared';
import type React from 'react';
import { StaffRolesPage } from './staff-roles.tsx';
import { StaffUsersPage } from './staff-users.tsx';

export const UserManagementPage: React.FC = () => {
	return (
		<SubPageLayout
			fixedHeader={false}
			header={<div style={{ padding: '16px 24px', fontWeight: 700, fontSize: 18 }}>User Management</div>}
		>
			<VerticalTabs
				pages={[
					{
						id: 'staff-users',
						link: 'staff-users',
						path: 'staff-users/*',
						title: 'Staff Users',
						icon: <UserOutlined />,
						element: <StaffUsersPage />,
					},
					{
						id: 'staff-roles',
						link: 'staff-roles',
						path: 'staff-roles/*',
						title: 'Staff Roles',
						icon: <SafetyOutlined />,
						element: <StaffRolesPage />,
					},
				]}
			/>
		</SubPageLayout>
	);
};
