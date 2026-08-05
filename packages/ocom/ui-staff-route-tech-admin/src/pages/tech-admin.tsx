import { DatabaseOutlined } from '@ant-design/icons';
import { StaffAuthContext, SubPageLayout, VerticalTabs } from '@ocom/ui-staff-shared';
import type React from 'react';
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { QueueExplorerPage } from './queue-explorer.tsx';

export const TechAdminPage: React.FC = () => {
	const auth = useContext(StaffAuthContext);
	const canViewQueues = auth?.permissions?.canViewQueues === true;

	const pages = [
		...(canViewQueues
			? [
					{
						id: 'queue-explorer',
						link: 'queue-explorer',
						path: 'queue-explorer/*',
						title: 'Queue Explorer',
						icon: <DatabaseOutlined />,
						element: <QueueExplorerPage />,
					},
				]
			: []),
	];

	if (pages.length === 0) {
		return (
			<Navigate
				to="/unauthorized"
				replace
			/>
		);
	}

	return (
		<SubPageLayout
			fixedHeader={false}
			header={<div style={{ padding: '16px 24px', fontWeight: 700, fontSize: 18 }}>Tech Admin</div>}
		>
			<VerticalTabs pages={pages} />
		</SubPageLayout>
	);
};
