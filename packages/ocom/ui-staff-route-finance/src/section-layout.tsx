import { SectionLayout as SharedSectionLayout, type SectionLayoutProps } from '@ocom/ui-staff-shared';
import { DollarOutlined } from '@ant-design/icons';
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
