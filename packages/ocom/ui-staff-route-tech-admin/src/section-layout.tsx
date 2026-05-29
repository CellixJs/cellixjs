import { ToolOutlined, DashboardOutlined } from '@ant-design/icons';
import { type SectionLayoutProps, SectionLayout as SharedSectionLayout, type StaffAuth } from '@ocom/ui-staff-shared';
import type React from 'react';
export const SectionLayout: React.FC = () => {
	const hasDatabaseExplorerAccess = (member: unknown): boolean => {
		const auth = member as StaffAuth | undefined;
		const perms = auth?.permissions;
		return perms?.canManageTechAdmin === true || perms?.canViewDatabaseDocuments === true;
	};

	const pageLayouts: SectionLayoutProps['pageLayouts'] = [
		{
			path: '/staff/tech',
			title: 'Tech Admin',
			icon: <ToolOutlined />,
			id: 'tech',
		},
		{
			path: '/staff/tech/database-explorer',
			title: 'Database',
			icon: <DashboardOutlined />,
			id: 'database-explorer',
			parent: 'tech',
			hasPermissions: hasDatabaseExplorerAccess,
		},
	];

	return (
		<SharedSectionLayout
			title="Tech Admin"
			description="Tech admin route package mounted under /staff/tech."
			pageLayouts={pageLayouts}
		/>
	);
};
