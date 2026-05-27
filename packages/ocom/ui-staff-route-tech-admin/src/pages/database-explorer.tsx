import { DashboardOutlined } from '@ant-design/icons';
import { RequireRole, StaffAppRoles, SubPageLayout, VerticalTabs } from '@ocom/ui-staff-shared';
import type React from 'react';
import { DatabaseExplorerContainer } from '../components/database-explorer.container.tsx';

export const DatabaseExplorerPage: React.FC = () => {
	const pages = [
		{
			id: 'database-explorer',
			link: '',
			path: '',
			title: 'Database Explorer',
			icon: <DashboardOutlined />,
			element: <DatabaseExplorerContainer />,
		},
	];

	return (
		<RequireRole
			roles={[StaffAppRoles.TechAdmin]}
			permKey="canViewDatabaseDocuments"
		>
			<SubPageLayout
				fixedHeader={false}
				header={<div style={{ padding: '16px 24px', fontWeight: 700, fontSize: 18 }}>Database Explorer</div>}
			>
				<VerticalTabs pages={pages} />
			</SubPageLayout>
		</RequireRole>
	);
};

export default DatabaseExplorerPage;
