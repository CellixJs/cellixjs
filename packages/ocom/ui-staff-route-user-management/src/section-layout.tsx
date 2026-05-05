import { TeamOutlined } from '@ant-design/icons';
import { type SectionLayoutProps, SectionLayout as SharedSectionLayout } from '@ocom/ui-staff-shared';
import type React from 'react';
export const SectionLayout: React.FC = () => {
	const pageLayouts: SectionLayoutProps['pageLayouts'] = [
		{
			path: '/staff/user-management',
			title: 'User Management',
			icon: <TeamOutlined />,
			id: 'users',
		},
	];

	return (
		<SharedSectionLayout
			title="User Management"
			description="User management route package mounted under /staff/user-management."
			pageLayouts={pageLayouts}
		/>
	);
};
