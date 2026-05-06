import { TeamOutlined } from '@ant-design/icons';
import { type SectionLayoutProps, SectionLayout as SharedSectionLayout } from '@ocom/ui-staff-shared';
import type React from 'react';
export const SectionLayout: React.FC = () => {
	const pageLayouts: SectionLayoutProps['pageLayouts'] = [
		{
			path: '/staff/community-management',
			title: 'Community Management',
			icon: <TeamOutlined />,
			id: 'ROOT',
		},
	];

	return (
		<SharedSectionLayout
			title="Community Management"
			description="Community management route package mounted under /staff/community-management."
			pageLayouts={pageLayouts}
		/>
	);
};
