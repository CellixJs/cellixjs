import { RequireRole, StaffAppRoles, SubPageLayout } from '@ocom/ui-staff-shared';
import type React from 'react';
import { DatabaseExplorerContainer } from '../components/database-explorer.container.tsx';

export const DatabaseExplorerPage: React.FC = () => {
	return (
		<RequireRole
			roles={[StaffAppRoles.TechAdmin]}
			permKey="canViewDatabaseDocuments"
		>
			<SubPageLayout
				fixedHeader={false}
				header={<div style={{ padding: '16px 24px', fontWeight: 700, fontSize: 18 }}>Database Explorer</div>}
			>
				<DatabaseExplorerContainer />
			</SubPageLayout>
		</RequireRole>
	);
};
