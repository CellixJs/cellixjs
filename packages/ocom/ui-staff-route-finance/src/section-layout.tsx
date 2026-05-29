import { DollarOutlined } from '@ant-design/icons';
import { type SectionLayoutProps, SectionLayout as SharedSectionLayout } from '@ocom/ui-staff-shared';
import type React from 'react';
export const SectionLayout: React.FC = () => {
	const pageLayouts: SectionLayoutProps['pageLayouts'] = [
		{
			path: '/staff/finance',
			title: 'Finance',
			icon: <DollarOutlined />,
			id: 'finance',
		},
	];

	return (
		<SharedSectionLayout
			title="Finance"
			description="Finance route package mounted under /staff/finance."
			pageLayouts={pageLayouts}
		/>
	);
};
