import { CloudServerOutlined, DownloadOutlined, EyeOutlined, FolderOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Breadcrumb, Button, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';

const { Title, Text, Paragraph } = Typography;

type BlobKeyValue = { key: string; value: string };

type BlobExplorerFolder = {
	name: string;
	prefix: string;
};

export type BlobExplorerBlob = {
	name: string;
	blobName: string;
	contentType?: string | null | undefined;
	contentLength: number;
	lastModified?: string | null | undefined;
	metadata: BlobKeyValue[];
	tags: BlobKeyValue[];
};

export type BlobPreviewContent = {
	blobName: string;
	contentType?: string | null;
	contentLength: number;
	lastModified?: string | null;
	metadata: BlobKeyValue[];
	tags: BlobKeyValue[];
	contentBase64: string;
	encoding?: string | null;
	downloadUrl?: string | null;
};

export type BlobExplorerFilters = {
	nameContains: string;
	metadataKey: string;
	metadataValue: string;
	tagKey: string;
	tagValue: string;
};

interface BlobStorageExplorerProps {
	containers: string[];
	selectedContainer?: string | undefined;
	onSelectContainer: (container: string) => void;
	prefix: string;
	onNavigatePrefix: (prefix: string) => void;
	folders: BlobExplorerFolder[];
	blobs: BlobExplorerBlob[];
	continuationToken?: string | null | undefined;
	onLoadMore: () => void;
	filters: BlobExplorerFilters;
	onApplyFilters: (filters: BlobExplorerFilters) => void;
	onRefresh: () => void;
	loading?: boolean | undefined;
	previewLoading?: boolean | undefined;
	preview?: BlobPreviewContent | null | undefined;
	onViewBlob: (blob: BlobExplorerBlob) => void;
	onClosePreview: () => void;
}

function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) {
		return '—';
	}
	if (bytes < 1024) {
		return `${bytes} B`;
	}
	const units = ['KB', 'MB', 'GB', 'TB'];
	let value = bytes / 1024;
	let unitIndex = 0;
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}
	return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatKeyValues(entries: BlobKeyValue[]): React.ReactNode {
	if (entries.length === 0) {
		return <Text type="secondary">—</Text>;
	}
	return (
		<Space
			size={[4, 4]}
			wrap
		>
			{entries.map((entry) => (
				<Tag key={`${entry.key}:${entry.value}`}>
					{entry.key}={entry.value}
				</Tag>
			))}
		</Space>
	);
}

function decodePreviewText(contentBase64: string): string {
	try {
		const binary = atob(contentBase64);
		const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
		return new TextDecoder().decode(bytes);
	} catch {
		return '[Unable to decode text content]';
	}
}

function isImageContentType(contentType: string | null | undefined): boolean {
	return Boolean(contentType?.toLowerCase().startsWith('image/'));
}

function isPdfContentType(contentType: string | null | undefined): boolean {
	return contentType?.toLowerCase().startsWith('application/pdf') === true;
}

function isTextPreview(contentType: string | null | undefined, encoding: string | null | undefined): boolean {
	if (encoding === 'utf-8') {
		return true;
	}
	if (!contentType) {
		return false;
	}
	const normalized = contentType.toLowerCase().split(';')[0]?.trim() ?? '';
	return normalized.startsWith('text/') || normalized === 'application/json' || normalized === 'application/xml' || normalized.endsWith('+json') || normalized.endsWith('+xml');
}

type TableRow =
	| { key: string; kind: 'folder'; name: string; prefix: string }
	| {
			key: string;
			kind: 'blob';
			name: string;
			blobName: string;
			contentType?: string | null | undefined;
			contentLength: number;
			lastModified?: string | null | undefined;
			metadata: BlobKeyValue[];
			tags: BlobKeyValue[];
	  };

export const BlobStorageExplorer: React.FC<BlobStorageExplorerProps> = ({
	containers,
	selectedContainer,
	onSelectContainer,
	prefix,
	onNavigatePrefix,
	folders,
	blobs,
	continuationToken,
	onLoadMore,
	filters,
	onApplyFilters,
	onRefresh,
	loading,
	previewLoading,
	preview,
	onViewBlob,
	onClosePreview,
}) => {
	const [draftFilters, setDraftFilters] = useState(filters);

	useEffect(() => {
		setDraftFilters(filters);
	}, [filters]);

	const breadcrumbItems = useMemo(() => {
		const segments = prefix.split('/').filter(Boolean);
		const items = [
			{
				title: (
					<Button
						type="link"
						onClick={() => onNavigatePrefix('')}
						style={{ padding: 0 }}
					>
						{selectedContainer || 'Container'}
					</Button>
				),
			},
		];
		segments.forEach((segment, index) => {
			const nextPrefix = `${segments.slice(0, index + 1).join('/')}/`;
			items.push({
				title: (
					<Button
						type="link"
						onClick={() => onNavigatePrefix(nextPrefix)}
						style={{ padding: 0 }}
					>
						{segment}
					</Button>
				),
			});
		});
		return items;
	}, [onNavigatePrefix, prefix, selectedContainer]);

	const rows: TableRow[] = [
		...folders.map((folder) => ({
			key: `folder:${folder.prefix}`,
			kind: 'folder' as const,
			name: folder.name,
			prefix: folder.prefix,
		})),
		...blobs.map((blob) => ({
			key: `blob:${blob.blobName}`,
			kind: 'blob' as const,
			name: blob.name,
			blobName: blob.blobName,
			contentType: blob.contentType,
			contentLength: blob.contentLength,
			lastModified: blob.lastModified,
			metadata: blob.metadata,
			tags: blob.tags,
		})),
	];

	const columns: TableColumnsType<TableRow> = [
		{
			title: 'Name',
			dataIndex: 'name',
			key: 'name',
			render: (_value, record) =>
				record.kind === 'folder' ? (
					<Button
						type="link"
						icon={<FolderOutlined />}
						onClick={() => onNavigatePrefix(record.prefix)}
						style={{ paddingInline: 0 }}
					>
						{record.name}/
					</Button>
				) : (
					<span>{record.name}</span>
				),
		},
		{
			title: 'Content type',
			key: 'contentType',
			render: (_value, record) => (record.kind === 'blob' ? (record.contentType ?? '—') : 'folder'),
		},
		{
			title: 'Size',
			key: 'size',
			render: (_value, record) => (record.kind === 'blob' ? formatBytes(record.contentLength) : '—'),
		},
		{
			title: 'Last modified',
			key: 'lastModified',
			render: (_value, record) => (record.kind === 'blob' && record.lastModified ? new Date(record.lastModified).toLocaleString() : '—'),
		},
		{
			title: 'Tags',
			key: 'tags',
			render: (_value, record) => (record.kind === 'blob' ? formatKeyValues(record.tags) : '—'),
		},
		{
			title: 'Metadata',
			key: 'metadata',
			render: (_value, record) => (record.kind === 'blob' ? formatKeyValues(record.metadata) : '—'),
		},
		{
			title: 'Actions',
			key: 'actions',
			render: (_value, record) =>
				record.kind === 'blob' ? (
					<Button
						aria-label={`View blob ${record.blobName}`}
						icon={<EyeOutlined />}
						size="small"
						type="link"
						onClick={() =>
							onViewBlob({
								name: record.name,
								blobName: record.blobName,
								contentType: record.contentType,
								contentLength: record.contentLength,
								lastModified: record.lastModified,
								metadata: record.metadata,
								tags: record.tags,
							})
						}
					>
						View
					</Button>
				) : null,
		},
	];

	const previewObjectUrl = useMemo(() => {
		if (!preview?.contentBase64) {
			return null;
		}
		if (!isImageContentType(preview.contentType) && !isPdfContentType(preview.contentType)) {
			return null;
		}
		const binary = atob(preview.contentBase64);
		const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
		const blob = new Blob([bytes], { type: preview.contentType ?? 'application/octet-stream' });
		return URL.createObjectURL(blob);
	}, [preview]);

	const handleDownload = () => {
		if (!preview) {
			return;
		}
		const binary = atob(preview.contentBase64);
		const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
		const blob = new Blob([bytes], { type: preview.contentType ?? 'application/octet-stream' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = preview.blobName.split('/').pop() ?? preview.blobName;
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(url);
	};

	return (
		<Space
			direction="vertical"
			style={{ width: '100%' }}
			size="large"
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Title
					level={3}
					style={{ margin: 0 }}
				>
					Blob Storage Explorer
				</Title>
				<Button
					icon={<ReloadOutlined />}
					onClick={onRefresh}
					disabled={!selectedContainer}
				>
					Refresh
				</Button>
			</div>

			<div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
				<Select<string>
					style={{ minWidth: 240 }}
					size="large"
					placeholder="Select container"
					value={selectedContainer ?? null}
					onChange={onSelectContainer}
					options={containers.map((container) => ({ label: container, value: container }))}
					suffixIcon={<CloudServerOutlined />}
				/>
				<Input
					style={{ width: 180 }}
					placeholder="Name contains"
					value={draftFilters.nameContains}
					onChange={(event) => setDraftFilters({ ...draftFilters, nameContains: event.target.value })}
					aria-label="Filter by blob name"
				/>
				<Input
					style={{ width: 140 }}
					placeholder="Metadata key"
					value={draftFilters.metadataKey}
					onChange={(event) => setDraftFilters({ ...draftFilters, metadataKey: event.target.value })}
					aria-label="Filter by metadata key"
				/>
				<Input
					style={{ width: 140 }}
					placeholder="Metadata value"
					value={draftFilters.metadataValue}
					onChange={(event) => setDraftFilters({ ...draftFilters, metadataValue: event.target.value })}
					aria-label="Filter by metadata value"
				/>
				<Input
					style={{ width: 120 }}
					placeholder="Tag key"
					value={draftFilters.tagKey}
					onChange={(event) => setDraftFilters({ ...draftFilters, tagKey: event.target.value })}
					aria-label="Filter by tag key"
				/>
				<Input
					style={{ width: 120 }}
					placeholder="Tag value"
					value={draftFilters.tagValue}
					onChange={(event) => setDraftFilters({ ...draftFilters, tagValue: event.target.value })}
					aria-label="Filter by tag value"
				/>
				<Button
					type="primary"
					size="large"
					disabled={!selectedContainer}
					onClick={() => onApplyFilters(draftFilters)}
				>
					Apply filters
				</Button>
			</div>

			{selectedContainer ? <Breadcrumb items={breadcrumbItems} /> : null}

			<Table<TableRow>
				dataSource={rows}
				columns={columns}
				rowKey="key"
				loading={!!loading}
				pagination={false}
			/>

			{continuationToken ? (
				<div style={{ display: 'flex', justifyContent: 'center' }}>
					<Button
						onClick={onLoadMore}
						loading={!!loading}
					>
						Load more
					</Button>
				</div>
			) : null}

			<Modal
				open={Boolean(preview) || !!previewLoading}
				title={preview?.blobName ?? 'Blob preview'}
				onCancel={onClosePreview}
				footer={[
					<Button
						key="close"
						onClick={onClosePreview}
					>
						Close
					</Button>,
					<Button
						key="download"
						type="primary"
						icon={<DownloadOutlined />}
						onClick={handleDownload}
						disabled={!preview}
						aria-label="Download blob"
					>
						Download
					</Button>,
				]}
				width="80vw"
				style={{ top: 24 }}
			>
				{previewLoading && !preview ? <Paragraph>Loading preview…</Paragraph> : null}
				{preview ? (
					<Space
						direction="vertical"
						style={{ width: '100%' }}
						size="middle"
					>
						<Text type="secondary">
							{preview.contentType ?? 'unknown type'} · {formatBytes(preview.contentLength)}
							{preview.lastModified ? ` · ${new Date(preview.lastModified).toLocaleString()}` : ''}
						</Text>
						<div>
							<Text strong>Tags</Text>
							<div>{formatKeyValues(preview.tags)}</div>
						</div>
						<div>
							<Text strong>Metadata</Text>
							<div>{formatKeyValues(preview.metadata)}</div>
						</div>
						{isImageContentType(preview.contentType) && previewObjectUrl ? (
							<img
								src={previewObjectUrl}
								alt={preview.blobName}
								style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
							/>
						) : null}
						{isPdfContentType(preview.contentType) && previewObjectUrl ? (
							<iframe
								title={preview.blobName}
								src={previewObjectUrl}
								style={{ width: '100%', height: '60vh', border: 'none' }}
							/>
						) : null}
						{isTextPreview(preview.contentType, preview.encoding) ? (
							<pre
								style={{
									whiteSpace: 'pre-wrap',
									overflow: 'auto',
									maxHeight: '60vh',
									margin: 0,
									fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
								}}
							>
								{decodePreviewText(preview.contentBase64)}
							</pre>
						) : null}
						{!isImageContentType(preview.contentType) && !isPdfContentType(preview.contentType) && !isTextPreview(preview.contentType, preview.encoding) ? (
							<Paragraph type="secondary">Preview is not available for this content type. Use Download to save the original blob.</Paragraph>
						) : null}
					</Space>
				) : null}
			</Modal>
		</Space>
	);
};
