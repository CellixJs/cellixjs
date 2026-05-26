import { ToolOutlined } from '@ant-design/icons';
import { type SectionLayoutProps, SectionLayout as SharedSectionLayout } from '@ocom/ui-staff-shared';
import type React from 'react';
export const SectionLayout: React.FC = () => {
	const pageLayouts: SectionLayoutProps['pageLayouts'] = [
		{
			path: '/staff/tech',
			title: 'Tech Admin',
			icon: <ToolOutlined />,
			id: 'tech',
		},
		{
			path: '/staff/tech/database-explorer',
			title: 'Database Explorer',
			icon: <ToolOutlined />,
			id: 'database-explorer',
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
