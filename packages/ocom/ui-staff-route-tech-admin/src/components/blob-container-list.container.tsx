import { useQuery } from '@apollo/client';
import type React from 'react';
import { BlobExplorerContainersDocument } from '../generated.tsx';
import { BlobContainerList } from './blob-container-list.tsx';

export interface BlobContainerListContainerProps {
	onSelect: (containerName: string) => void;
}

export const BlobContainerListContainer: React.FC<BlobContainerListContainerProps> = ({ onSelect }) => {
	const { data, loading } = useQuery(BlobExplorerContainersDocument, {
		fetchPolicy: 'cache-and-network',
	});

	return (
		<BlobContainerList
			containers={(data?.blobExplorerListContainers.containers ?? []).map((c) => ({ name: c.name }))}
			onSelect={onSelect}
			loading={loading}
		/>
	);
};
