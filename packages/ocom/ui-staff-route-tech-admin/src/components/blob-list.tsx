import type { TableColumnsType } from 'antd';
import { Breadcrumb, Button, Space, Spin, Table, Typography } from 'antd';
import type React from 'react';

const { Title } = Typography;

export interface BlobExplorerBlobItemProps {
	name: string;
	contentType?: string | null;
	contentLength?: number | null;
	lastModified?: string | null;
	metadata?: unknown;
	tags?: unknown;
}

export interface BlobListProps {
	items: BlobExplorerBlobItemProps[];
	prefixes: string[];
	onNavigate: (prefix: string) => void;
	onView: (item: BlobExplorerBlobItemProps) => void;
	breadcrumbs: string[];
	onBreadcrumb: (index: number) => void;
	continuationToken?: string | null;
	onLoadMore?: () => void;
	loading?: boolean;
}

export const BlobList: React.FC<BlobListProps> = ({ items, prefixes, onNavigate, onView, breadcrumbs, onBreadcrumb, continuationToken, onLoadMore, loading }) => {
	const columns: TableColumnsType<BlobExplorerBlobItemProps> = [
		{ title: 'Name', dataIndex: 'name', key: 'name' },
		{ title: 'Content Type', dataIndex: 'contentType', key: 'contentType', render: (v: string | null) => v ?? '—' },
		{
			title: 'Size',
			dataIndex: 'contentLength',
			key: 'contentLength',
			render: (v: number | null) => (v != null ? `${v} bytes` : '—'),
		},
		{
			title: 'Last Modified',
			dataIndex: 'lastModified',
			key: 'lastModified',
			render: (v: string | null) => (v ? new Date(v).toLocaleDateString() : '—'),
		},
		{
			title: 'Action',
			key: 'action',
			render: (_: unknown, record: BlobExplorerBlobItemProps) => (
				<Button
					type="link"
					onClick={() => onView(record)}
				>
					View
				</Button>
			),
		},
	];

	const prefixItems = prefixes.map((prefix) => ({
		name: prefix,
		contentType: undefined,
		contentLength: undefined,
		lastModified: undefined,
	}));

	const prefixColumns: TableColumnsType<{ name: string }> = [
		{
			title: 'Virtual Directory',
			dataIndex: 'name',
			key: 'name',
			render: (name: string) => (
				<Button
					type="link"
					onClick={() => onNavigate(name)}
				>
					📁 {name}
				</Button>
			),
		},
	];

	return (
		<Space
			direction="vertical"
			size="middle"
			style={{ width: '100%' }}
		>
			<Breadcrumb
				items={[
					{
						title: (
							<Button
								type="link"
								onClick={() => onBreadcrumb(-1)}
							>
								Root
							</Button>
						),
					},
					...breadcrumbs.map((crumb, index) => ({
						title: (
							<Button
								type="link"
								onClick={() => onBreadcrumb(index)}
							>
								{crumb}
							</Button>
						),
					})),
				]}
			/>
			{loading ? (
				<Spin />
			) : (
				<>
					{prefixes.length > 0 && (
						<>
							<Title level={5}>Virtual Directories</Title>
							<Table
								rowKey="name"
								columns={prefixColumns}
								dataSource={prefixItems}
								pagination={false}
								size="small"
							/>
						</>
					)}
					<Title level={5}>Blobs</Title>
					<Table
						rowKey="name"
						columns={columns}
						dataSource={items}
						pagination={false}
						size="small"
					/>
					{continuationToken && onLoadMore && <Button onClick={onLoadMore}>Load More</Button>}
				</>
			)}
		</Space>
	);
};
