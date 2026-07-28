import { useQuery } from '@apollo/client';
import type React from 'react';
import { useState } from 'react';
import { BlobExplorerBlobsDocument } from '../generated.tsx';
import type { BlobExplorerBlobItemProps } from './blob-list.tsx';
import { BlobList } from './blob-list.tsx';

export interface BlobListContainerProps {
	containerName: string;
	onView?: (item: BlobExplorerBlobItemProps) => void;
}

export const BlobListContainer: React.FC<BlobListContainerProps> = ({ containerName, onView }) => {
	const [prefix, setPrefix] = useState<string>('');
	const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
	const [allItems, setAllItems] = useState<BlobExplorerBlobItemProps[]>([]);
	const [allPrefixes, setAllPrefixes] = useState<string[]>([]);
	const [continuationToken, setContinuationToken] = useState<string | undefined>(undefined);

	const { data, loading, fetchMore } = useQuery(BlobExplorerBlobsDocument, {
		variables: { input: { containerName, ...(prefix ? { prefix } : {}) } },
		fetchPolicy: 'cache-and-network',
		onCompleted: (result) => {
			const page = result.blobExplorerListBlobs;
			setAllItems(
				page.items.map((item) => ({
					name: item.name,
					...(item.contentType != null ? { contentType: item.contentType } : {}),
					...(item.contentLength != null ? { contentLength: item.contentLength } : {}),
					...(item.lastModified != null ? { lastModified: item.lastModified } : {}),
					...(item.metadata != null ? { metadata: item.metadata } : {}),
					...(item.tags != null ? { tags: item.tags } : {}),
				})),
			);
			setAllPrefixes([...page.prefixes]);
			setContinuationToken(page.continuationToken ?? undefined);
		},
	});

	const handleNavigate = (newPrefix: string) => {
		setAllItems([]);
		setAllPrefixes([]);
		setContinuationToken(undefined);
		const segments = newPrefix.replace(/\/$/, '').split('/');
		setBreadcrumbs(segments);
		setPrefix(newPrefix);
	};

	const handleBreadcrumb = (index: number) => {
		if (index < 0) {
			setPrefix('');
			setBreadcrumbs([]);
		} else {
			const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
			const newPrefix = `${newBreadcrumbs.join('/')}/`;
			setBreadcrumbs(newBreadcrumbs);
			setPrefix(newPrefix);
		}
		setAllItems([]);
		setAllPrefixes([]);
		setContinuationToken(undefined);
	};

	const handleLoadMore = async () => {
		if (!continuationToken) return;
		const result = await fetchMore({
			variables: { input: { containerName, ...(prefix ? { prefix } : {}), continuationToken } },
		});
		const page = result.data.blobExplorerListBlobs;
		setAllItems((prev) => [
			...prev,
			...page.items.map((item) => ({
				name: item.name,
				...(item.contentType != null ? { contentType: item.contentType } : {}),
				...(item.contentLength != null ? { contentLength: item.contentLength } : {}),
				...(item.lastModified != null ? { lastModified: item.lastModified } : {}),
				...(item.metadata != null ? { metadata: item.metadata } : {}),
				...(item.tags != null ? { tags: item.tags } : {}),
			})),
		]);
		setContinuationToken(page.continuationToken ?? undefined);
	};

	void data;

	return (
		<BlobList
			items={allItems}
			prefixes={allPrefixes}
			onNavigate={handleNavigate}
			onView={(item) => onView?.(item)}
			breadcrumbs={breadcrumbs}
			onBreadcrumb={handleBreadcrumb}
			{...(continuationToken ? { continuationToken } : {})}
			{...(onView
				? {
						onLoadMore: () => {
							void handleLoadMore();
						},
					}
				: {})}
			loading={loading}
		/>
	);
};
