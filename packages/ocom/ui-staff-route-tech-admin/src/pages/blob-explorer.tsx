import { StaffAuthContext, SubPageLayout } from '@ocom/ui-staff-shared';
import { Button, Typography } from 'antd';
import type React from 'react';
import { useContext, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BlobContainerListContainer } from '../components/blob-container-list.container.tsx';
import { BlobListContainer } from '../components/blob-list.container.tsx';
import type { BlobExplorerBlobItemProps } from '../components/blob-list.tsx';
import { BlobPreviewModalContainer } from '../components/blob-preview-modal.container.tsx';

const { Title } = Typography;

export const BlobExplorerPage: React.FC = () => {
	const auth = useContext(StaffAuthContext);
	const perms = auth?.permissions;
	const canView = perms?.canViewBlobExplorer === true || perms?.canManageTechAdmin === true;

	const [selectedContainer, setSelectedContainer] = useState<string | null>(null);
	const [previewBlob, setPreviewBlob] = useState<BlobExplorerBlobItemProps | null>(null);

	if (!canView) {
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
			header={<div style={{ padding: '16px 24px', fontWeight: 700, fontSize: 18 }}>Blob Storage Explorer</div>}
		>
			{selectedContainer ? (
				<>
					<div style={{ padding: '8px 24px' }}>
						<Button
							onClick={() => setSelectedContainer(null)}
							type="default"
						>
							← Back to Containers
						</Button>
						<Title
							level={4}
							style={{ display: 'inline-block', marginLeft: 16, marginBottom: 0 }}
						>
							{selectedContainer}
						</Title>
					</div>
					<div style={{ padding: '0 24px 24px' }}>
						<BlobListContainer
							containerName={selectedContainer}
							onView={setPreviewBlob}
						/>
					</div>
				</>
			) : (
				<div style={{ padding: '0 24px 24px' }}>
					<Title level={4}>Containers</Title>
					<BlobContainerListContainer onSelect={setSelectedContainer} />
				</div>
			)}
			<BlobPreviewModalContainer
				open={previewBlob !== null}
				containerName={selectedContainer ?? ''}
				blobItem={previewBlob}
				onClose={() => setPreviewBlob(null)}
			/>
		</SubPageLayout>
	);
};
