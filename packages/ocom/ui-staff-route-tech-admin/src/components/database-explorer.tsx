import { CopyOutlined, ExpandOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Select, Space, Table, Tooltip, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type React from 'react';
import { useState } from 'react';

const { Title } = Typography;
const { TextArea } = Input;
export interface DatabaseDocument {
	id: string;
	json: string;
}

interface DatabaseExplorerProps {
	collections: string[];
	selectedCollection?: string;
	onSelectCollection: (col: string) => void;
	filter: string;
	onChangeFilter: (val: string) => void;
	onApplyFilter: () => void;
	documents: DatabaseDocument[];
	totalCount: number;
	page: number;
	pageSize: number;
	onChangePage: (page: number, pageSize?: number) => void;
	loading?: boolean;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({
	collections,
	selectedCollection,
	onSelectCollection,
	filter,
	onChangeFilter,
	onApplyFilter,
	documents,
	totalCount,
	page,
	pageSize,
	onChangePage,
	loading,
}) => {
	const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
	const [selectedJson, setSelectedJson] = useState<string>('');

	const columns: TableColumnsType<DatabaseDocument> = [
		{ title: 'ID', dataIndex: 'id', key: 'id' },
		{
			title: 'Preview',
			dataIndex: 'json',
			key: 'preview',
			render: (json: string) => {
				try {
					const obj = JSON.parse(json);
					return <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'auto' }}>{JSON.stringify(obj, null, 2)}</pre>;
				} catch (_e) {
					return <span>Invalid JSON</span>;
				}
			},
		},
		{
			title: 'Actions',
			key: 'actions',
			render: (_value: unknown, record: DatabaseDocument) => (
				<Space size="small">
					<Tooltip title="View full JSON">
						<Button
							aria-label={`Open JSON modal for ${record.id}`}
							icon={<ExpandOutlined />}
							onClick={() => {
								try {
									setSelectedJson(JSON.stringify(JSON.parse(record.json), null, 2));
								} catch (_e) {
									setSelectedJson(record.json);
								}
								setIsJsonModalOpen(true);
							}}
							size="small"
							type="text"
						/>
					</Tooltip>
					<Tooltip title="Copy JSON">
						<Button
							aria-label={`Copy JSON for ${record.id}`}
							icon={<CopyOutlined />}
							onClick={() => {
								if (typeof navigator !== 'undefined' && navigator.clipboard) {
									void navigator.clipboard.writeText(record.json);
								}
							}}
							size="small"
							type="text"
						/>
					</Tooltip>
				</Space>
			),
		},
	];

	return (
		<Space direction="vertical" style={{ width: '100%' }} size="large">
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Title level={3}>Database Explorer</Title>
			</div>
			<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
				<Select<string>
					style={{ minWidth: 240 }}
					size="large"
					placeholder="Select collection"
					value={selectedCollection ?? null}
					onChange={onSelectCollection}
					options={collections.map((c) => ({ label: c, value: c }))}
				/>
				<TextArea
					style={{ width: 480, height: 40, minHeight: 40, resize: 'vertical' }}
					placeholder='Filter (JSON) e.g. {"name":"Alice"}'
					value={filter}
					onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeFilter(e.target.value)}
				/>
				<Button
					type="primary"
					size="large"
					onClick={onApplyFilter}
				>
					Apply
				</Button>
			</div>
			<Table<DatabaseDocument>
				dataSource={documents}
				columns={columns}
				rowKey="id"
				loading={!!loading}
				pagination={{
					current: page,
					pageSize,
					total: totalCount,
					onChange: onChangePage,
					showSizeChanger: true,
				}}
			/>
			<Modal
				cancelText="Close"
				okText="Copy JSON"
				okButtonProps={{ icon: <CopyOutlined /> }}
				okType="primary"
				onCancel={() => {
					setIsJsonModalOpen(false);
					setSelectedJson('');
				}}
				onOk={() => {
					if (typeof navigator !== 'undefined' && navigator.clipboard) {
						void navigator.clipboard.writeText(selectedJson);
					}
				}}
				open={isJsonModalOpen}
				style={{ top: 12 }}
				title="Full JSON"
				width="95vw"
			>
				<pre
					style={{
						whiteSpace: 'pre-wrap',
						overflow: 'auto',
						maxHeight: 'calc(100vh - 220px)',
						margin: 0,
					}}
				>
					{selectedJson}
				</pre>
			</Modal>
		</Space>
	);
};
