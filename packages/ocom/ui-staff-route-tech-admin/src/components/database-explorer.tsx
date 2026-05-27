import { Button, Input, Select, Space, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type React from 'react';
import { useState } from 'react';

const { Title } = Typography;
const { TextArea } = Input;

export interface DatabaseDocument {
	id: string;
	json: string;
}

export interface DatabaseExplorerProps {
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
	const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

	const formatValueType = (value: unknown): string => {
		if (value === null) return 'null';
		if (Array.isArray(value)) return 'array';
		return typeof value;
	};

	const columns: TableColumnsType<DatabaseDocument> = [
		{ title: 'ID', dataIndex: 'id', key: 'id' },
		{
			title: 'Preview',
			dataIndex: 'json',
			key: 'preview',
			render: (json: string, record: DatabaseDocument) => {
				if (expandedRowKeys.includes(record.id)) return null;
				try {
					const obj = JSON.parse(json);
					return <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'auto' }}>{JSON.stringify(obj, null, 2)}</pre>;
				} catch (_e) {
					return <span>Invalid JSON</span>;
				}
			},
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
					placeholder="Select collection"
					value={selectedCollection ?? null}
					onChange={onSelectCollection}
					options={collections.map((c) => ({ label: c, value: c }))}
				/>
				<TextArea
					style={{ width: 480 }}
					placeholder='Filter (JSON) e.g. {"name":"Alice"}'
					value={filter}
					onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeFilter(e.target.value)}
				/>
				<Button type="primary" onClick={onApplyFilter}>Apply</Button>
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
				expandable={{
					expandedRowRender: (record: DatabaseDocument) => {
						try {
							const obj = JSON.parse(record.json);
							const fullJson = JSON.stringify(obj, null, 2);
							const rows: { key: string; type: string; value: string }[] = [];
							for (const [k, v] of Object.entries(obj)) {
								rows.push({ key: k, type: formatValueType(v), value: JSON.stringify(v, null, 2) });
							}
							return (
								<Space
									direction="vertical"
									style={{ width: '100%' }}
									size="middle"
								>
									<div>
										<Typography.Text strong={true}>Full JSON</Typography.Text>
										<pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{fullJson}</pre>
									</div>
									<Table
										dataSource={rows}
										columns={[
											{ title: 'Field', dataIndex: 'key', key: 'key' },
											{ title: 'Type', dataIndex: 'type', key: 'type' },
											{ title: 'Value', dataIndex: 'value', key: 'value', render: (val: string) => <pre style={{ whiteSpace: 'pre-wrap' }}>{val}</pre> },
										]}
										rowKey="key"
										pagination={false}
									/>
								</Space>
							);
						} catch (_e) {
							return <div>Invalid JSON</div>;
						}
					},
					expandedRowKeys,
					onExpandedRowsChange: (keys) => { setExpandedRowKeys([...keys]); },
				}}
			/>
		</Space>
	);
};

export default DatabaseExplorer;
