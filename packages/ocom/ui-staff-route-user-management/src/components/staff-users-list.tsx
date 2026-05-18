import { UsergroupAddOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Space, Table, Typography } from 'antd';
import type React from 'react';

const { Title } = Typography;

export interface StaffUser {
	id: string;
	displayName: string;
	email: string;
	role?: { id: string; roleName: string } | null;
	createdAt: string;
}

interface StaffUsersListProps {
	data: StaffUser[];
	onEdit: (id: string) => void;
	onCreate: () => void;
	loading?: boolean;
}

export const StaffUsersList: React.FC<StaffUsersListProps> = ({ data, onEdit, onCreate, loading }) => {
	const columns: TableColumnsType<StaffUser> = [
		{ title: 'Display Name', dataIndex: 'displayName', key: 'displayName' },
		{ title: 'Email', dataIndex: 'email', key: 'email' },
		{
			title: 'Role',
			key: 'role',
			render: (_: unknown, record: StaffUser) => record.role?.roleName ?? 'No Role',
		},
		{
			title: 'Created At',
			dataIndex: 'createdAt',
			key: 'createdAt',
			render: (date: string) => (date ? new Date(date).toLocaleDateString() : 'N/A'),
		},
		{
			title: 'Action',
			key: 'action',
			render: (_: unknown, record: StaffUser) => (
				<Button
					type="link"
					onClick={() => onEdit(record.id)}
				>
					Edit
				</Button>
			),
		},
	];

	return (
		<Space
			direction="vertical"
			size="large"
			style={{ width: '100%' }}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Title level={3}>Staff Users ({data.length})</Title>
				<Button
					type="primary"
					icon={<UsergroupAddOutlined />}
					onClick={onCreate}
				>
					Create Staff User
				</Button>
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
