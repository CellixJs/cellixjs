import { ToolOutlined } from '@ant-design/icons';
import { SubPageLayout, VerticalTabs } from '@ocom/ui-staff-shared';
import { StaffAuthContext } from '@ocom/ui-staff-shared';
import type React from 'react';
import { useContext } from 'react';
import { DatabaseExplorerContainer } from '../components/database-explorer.container.tsx';

export const DatabaseExplorerPage: React.FC = () => {
	const auth = useContext(StaffAuthContext);
	const perms = auth?.permissions;
	const canView = perms?.canViewDatabaseDocuments === true || perms?.canManageTechAdmin === true;

	const pages = [
		{
			id: 'database-explorer',
			link: 'database-explorer',
			path: 'database-explorer',
			title: 'Database Explorer',
			icon: <ToolOutlined />,
			element: <DatabaseExplorerContainer />,
		},
	];

	if (!canView) {
		return null;
	}

	return (
		<SubPageLayout
			fixedHeader={false}
			header={<div style={{ padding: '16px 24px', fontWeight: 700, fontSize: 18 }}>Database Explorer</div>}
		>
			<VerticalTabs pages={pages} />
		</SubPageLayout>
	);
};

export default DatabaseExplorerPage;
