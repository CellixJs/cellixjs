import { RequireRole, StaffAppRoles, SubPageLayout } from '@ocom/ui-staff-shared';
import type React from 'react';
import { BlobStorageExplorerContainer } from '../components/blob-storage-explorer.container.tsx';

export const BlobStorageExplorerPage: React.FC = () => {
	return (
		<RequireRole
			roles={[StaffAppRoles.TechAdmin]}
			permKey="canViewBlobExplorer"
		>
			<SubPageLayout
				fixedHeader={false}
				header={<div style={{ padding: '16px 24px', fontWeight: 700, fontSize: 18 }}>Blob Storage Explorer</div>}
			>
				<BlobStorageExplorerContainer />
			</SubPageLayout>
		</RequireRole>
	);
};
