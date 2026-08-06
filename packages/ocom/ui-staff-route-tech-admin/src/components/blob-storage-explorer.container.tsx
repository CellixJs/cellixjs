import { gql, useLazyQuery, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { Empty } from 'antd';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { type BlobExplorerBlob, type BlobExplorerFilters, type BlobPreviewContent, BlobStorageExplorer } from './blob-storage-explorer.tsx';

const CONTAINERS_QUERY = gql`
query TechAdminBlobStorageExplorerContainers {
  techAdminBlobContainers {
    name
  }
}
`;

const LIST_QUERY = gql`
query TechAdminBlobStorageExplorerList(
  $container: String!
  $prefix: String
  $continuationToken: String
  $pageSize: Int
  $nameContains: String
  $metadataKey: String
  $metadataValue: String
  $tagKey: String
  $tagValue: String
) {
  techAdminBlobList(
    container: $container
    prefix: $prefix
    continuationToken: $continuationToken
    pageSize: $pageSize
    nameContains: $nameContains
    metadataKey: $metadataKey
    metadataValue: $metadataValue
    tagKey: $tagKey
    tagValue: $tagValue
  ) {
    folders { name prefix }
    blobs {
      name
      blobName
      contentType
      contentLength
      lastModified
      metadata { key value }
      tags { key value }
    }
    continuationToken
  }
}
`;

const CONTENT_QUERY = gql`
query TechAdminBlobStorageExplorerContent($container: String!, $blobName: String!) {
  techAdminBlobContent(container: $container, blobName: $blobName) {
    blobName
    contentType
    contentLength
    lastModified
    metadata { key value }
    tags { key value }
    contentBase64
    encoding
    downloadUrl
  }
}
`;

interface ContainersQueryResult {
	techAdminBlobContainers: { name: string }[];
}

interface ListQueryResult {
	techAdminBlobList: {
		folders: { name: string; prefix: string }[];
		blobs: BlobExplorerBlob[];
		continuationToken?: string | null;
	};
}

interface ContentQueryResult {
	techAdminBlobContent: BlobPreviewContent;
}

const emptyFilters: BlobExplorerFilters = {
	nameContains: '',
	metadataKey: '',
	metadataValue: '',
	tagKey: '',
	tagValue: '',
};

export const BlobStorageExplorerContainer: React.FC = () => {
	const [selectedContainer, setSelectedContainer] = useState<string | undefined>(undefined);
	const [prefix, setPrefix] = useState('');
	const [draftFilters, setDraftFilters] = useState<BlobExplorerFilters>(emptyFilters);
	const [appliedFilters, setAppliedFilters] = useState<BlobExplorerFilters>(emptyFilters);
	const [accumulatedFolders, setAccumulatedFolders] = useState<{ name: string; prefix: string }[]>([]);
	const [accumulatedBlobs, setAccumulatedBlobs] = useState<BlobExplorerBlob[]>([]);
	const [continuationToken, setContinuationToken] = useState<string | null | undefined>(undefined);
	const [preview, setPreview] = useState<BlobPreviewContent | null>(null);

	const {
		data: containersData,
		loading: containersLoading,
		error: containersError,
		refetch: refetchContainers,
	} = useQuery<ContainersQueryResult>(CONTAINERS_QUERY, {
		fetchPolicy: 'cache-first',
	});

	const listVariables = useMemo(
		() => ({
			container: selectedContainer ?? '',
			prefix: prefix || undefined,
			pageSize: 50,
			nameContains: appliedFilters.nameContains || undefined,
			metadataKey: appliedFilters.metadataKey || undefined,
			metadataValue: appliedFilters.metadataValue || undefined,
			tagKey: appliedFilters.tagKey || undefined,
			tagValue: appliedFilters.tagValue || undefined,
		}),
		[selectedContainer, prefix, appliedFilters],
	);

	const { loading: listLoading, refetch: refetchList } = useQuery<ListQueryResult>(LIST_QUERY, {
		variables: listVariables,
		skip: !selectedContainer,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
		onCompleted: (data) => {
			setAccumulatedFolders(data.techAdminBlobList.folders);
			setAccumulatedBlobs(data.techAdminBlobList.blobs);
			setContinuationToken(data.techAdminBlobList.continuationToken);
		},
	});

	const [loadMoreQuery, { loading: loadMoreLoading }] = useLazyQuery<ListQueryResult>(LIST_QUERY, {
		fetchPolicy: 'network-only',
	});

	const [loadContent, { loading: previewLoading }] = useLazyQuery<ContentQueryResult>(CONTENT_QUERY, {
		fetchPolicy: 'network-only',
	});

	const resetListing = useCallback(() => {
		setAccumulatedFolders([]);
		setAccumulatedBlobs([]);
		setContinuationToken(undefined);
	}, []);

	const handleSelectContainer = (container: string) => {
		setSelectedContainer(container);
		setPrefix('');
		resetListing();
	};

	const handleNavigatePrefix = (nextPrefix: string) => {
		setPrefix(nextPrefix);
		resetListing();
	};

	const handleApplyFilters = () => {
		setAppliedFilters(draftFilters);
		resetListing();
	};

	const handleRefresh = async () => {
		await refetchContainers();
		if (selectedContainer) {
			resetListing();
			await refetchList();
		}
	};

	const handleLoadMore = async () => {
		if (!selectedContainer || !continuationToken) {
			return;
		}
		const result = await loadMoreQuery({
			variables: {
				...listVariables,
				continuationToken,
			},
		});
		const page = result.data?.techAdminBlobList;
		if (!page) {
			return;
		}
		setAccumulatedFolders((current) => [...current, ...page.folders]);
		setAccumulatedBlobs((current) => [...current, ...page.blobs]);
		setContinuationToken(page.continuationToken);
	};

	const handleViewBlob = async (blob: BlobExplorerBlob) => {
		if (!selectedContainer) {
			return;
		}
		setPreview(null);
		const result = await loadContent({
			variables: {
				container: selectedContainer,
				blobName: blob.blobName,
			},
		});
		if (result.data?.techAdminBlobContent) {
			setPreview(result.data.techAdminBlobContent);
		}
	};

	const containers = containersData?.techAdminBlobContainers.map((container) => container.name) ?? [];

	return (
		<ComponentQueryLoader
			error={containersError}
			loading={containersLoading}
			hasData={containers}
			hasDataComponent={
				containers.length === 0 ? (
					<Empty description="No blob containers available" />
				) : (
					<BlobStorageExplorer
						containers={containers}
						selectedContainer={selectedContainer}
						onSelectContainer={handleSelectContainer}
						prefix={prefix}
						onNavigatePrefix={handleNavigatePrefix}
						folders={accumulatedFolders}
						blobs={accumulatedBlobs}
						continuationToken={continuationToken}
						onLoadMore={() => {
							void handleLoadMore();
						}}
						filters={draftFilters}
						onChangeFilters={setDraftFilters}
						onApplyFilters={handleApplyFilters}
						onRefresh={() => {
							void handleRefresh();
						}}
						loading={listLoading || loadMoreLoading}
						previewLoading={previewLoading}
						preview={preview}
						onViewBlob={(blob) => {
							void handleViewBlob(blob);
						}}
						onClosePreview={() => setPreview(null)}
					/>
				)
			}
			noDataComponent={<Empty description="No blob containers" />}
		/>
	);
};
