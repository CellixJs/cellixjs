import { PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Space, Table, Typography } from 'antd';
import type React from 'react';

const { Title } = Typography;

export interface StaffRole {
	id: string;
	roleName: string;
	enterpriseAppRole: string;
	createdAt: string;
	updatedAt: string;
}

interface StaffRolesListProps {
	data: StaffRole[];
	onEdit: (id: string) => void;
	onCreate: () => void;
	canCreate?: boolean;
	canEdit?: boolean;
	loading?: boolean;
}

export const StaffRolesList: React.FC<StaffRolesListProps> = ({ data, onEdit, onCreate, canCreate = false, canEdit = false, loading }) => {
	const columns: TableColumnsType<StaffRole> = [
		{ title: 'Role Name', dataIndex: 'roleName', key: 'roleName' },
		{ title: 'Enterprise App Role', dataIndex: 'enterpriseAppRole', key: 'enterpriseAppRole' },
		{
			title: 'Created At',
			dataIndex: 'createdAt',
			key: 'createdAt',
			render: (date: string) => (date ? new Date(date).toLocaleDateString() : 'N/A'),
		},
		{
			title: 'Updated At',
			dataIndex: 'updatedAt',
			key: 'updatedAt',
			render: (date: string) => (date ? new Date(date).toLocaleDateString() : 'N/A'),
		},
		{
			title: 'Action',
			key: 'action',
			render: (_: unknown, record: StaffRole) =>
				canEdit ? (
					<Button
						type="link"
						onClick={() => onEdit(record.id)}
					>
						Edit
					</Button>
				) : null,
		},
	];

	return (
		<Space
			direction="vertical"
			size="large"
			style={{ width: '100%' }}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Title level={3}>Staff Roles ({data.length})</Title>
				{canCreate ? (
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={onCreate}
					>
						Create Staff Role
					</Button>
				) : null}
			</div>
			<Table
				dataSource={data}
				columns={columns}
				rowKey="id"
				loading={!!loading}
				pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }}
			/>
		</Space>
	);
};
