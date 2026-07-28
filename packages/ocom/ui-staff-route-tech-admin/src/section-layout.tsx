import { CloudServerOutlined, ToolOutlined } from '@ant-design/icons';
import { type SectionLayoutProps, SectionLayout as SharedSectionLayout, StaffAuthContext } from '@ocom/ui-staff-shared';
import type React from 'react';
import { useContext } from 'react';

export const SectionLayout: React.FC = () => {
	const auth = useContext(StaffAuthContext);
	const perms = auth?.permissions;
	const canViewBlobExplorer = perms?.canViewBlobExplorer === true || perms?.canManageTechAdmin === true;

	const pageLayouts: SectionLayoutProps['pageLayouts'] = [
		{
			path: '/staff/tech',
			title: 'Tech Admin',
			icon: <ToolOutlined />,
			id: 'tech',
		},
		...(canViewBlobExplorer
			? [
					{
						path: '/staff/tech/blob-explorer',
						title: 'Blob Storage Explorer',
						icon: <CloudServerOutlined />,
						id: 'blob-explorer',
					},
				]
			: []),
	];

	return (
		<SharedSectionLayout
			title="Tech Admin"
			description="Tech admin route package mounted under /staff/tech."
			pageLayouts={pageLayouts}
		/>
	);
};
