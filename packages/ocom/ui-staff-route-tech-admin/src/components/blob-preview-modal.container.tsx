import { useQuery } from '@apollo/client';
import type React from 'react';
import { BlobExplorerDownloadAuthDocument } from '../generated.tsx';
import type { BlobExplorerBlobItemProps } from './blob-list.tsx';
import { BlobPreviewModal } from './blob-preview-modal.tsx';

export interface BlobPreviewModalContainerProps {
	open: boolean;
	containerName: string;
	blobItem: BlobExplorerBlobItemProps | null;
	onClose: () => void;
}

export const BlobPreviewModalContainer: React.FC<BlobPreviewModalContainerProps> = ({ open, containerName, blobItem, onClose }) => {
	const { data, loading } = useQuery(BlobExplorerDownloadAuthDocument, {
		variables: {
			input: {
				containerName,
				blobName: blobItem?.name ?? '',
				contentLength: blobItem?.contentLength ?? 0,
				contentType: blobItem?.contentType ?? 'application/octet-stream',
			},
		},
		skip: !open || !blobItem,
	});

	return (
		<BlobPreviewModal
			open={open}
			blobName={blobItem?.name ?? ''}
			{...(blobItem?.contentType != null ? { contentType: blobItem.contentType } : {})}
			{...(data?.blobExplorerGetDownloadAuthorization.url ? { downloadUrl: data.blobExplorerGetDownloadAuthorization.url } : {})}
			{...(data?.blobExplorerGetDownloadAuthorization.authorizationHeader ? { authorizationHeader: data.blobExplorerGetDownloadAuthorization.authorizationHeader } : {})}
			onClose={onClose}
			loading={loading}
		/>
	);
};
