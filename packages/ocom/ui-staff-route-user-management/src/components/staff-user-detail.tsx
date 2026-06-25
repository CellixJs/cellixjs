import type { TableColumnsType } from 'antd';
import { Button, Descriptions, Select, Space, Table, Tag, Typography } from 'antd';
import type React from 'react';
import type { StaffUser } from './staff-users-list.tsx';

const { Title } = Typography;

export interface ActivityLogEntry {
	activityType: string;
	activityDescription: string;
	activityByStaffUserId: string;
	activityByStaffUserDisplayName: string;
	createdAt: string;
}

interface StaffUserDetailProps {
	data: StaffUser;
	availableRoles: { id: string; roleName: string }[];
	canAssignRoles: boolean;
	isEditingOwnRole?: boolean;
	currentRoleName?: string;
	selectedRoleId: string | null;
	onRoleChange: (roleId: string) => void;
	onSave: () => void;
	saveDisabled?: boolean;
	loading?: boolean;
	saveLoading?: boolean;
	activityLog?: ActivityLogEntry[];
}

const activityLogColumns: TableColumnsType<ActivityLogEntry> = [
	{
		title: 'Activity Type',
		dataIndex: 'activityType',
		key: 'activityType',
		render: (value: string) => <Tag>{value}</Tag>,
	},
	{
		title: 'Description',
		dataIndex: 'activityDescription',
		key: 'activityDescription',
	},
	{
		title: 'Performed By',
		dataIndex: 'activityByStaffUserDisplayName',
		key: 'activityByStaffUserDisplayName',
	},
	{
		title: 'Date',
		dataIndex: 'createdAt',
		key: 'createdAt',
		render: (value: string) => (value ? new Date(value).toLocaleString() : 'N/A'),
	},
];

export const StaffUserDetail: React.FC<StaffUserDetailProps> = ({
	data,
	availableRoles,
	canAssignRoles,
	isEditingOwnRole = false,
	currentRoleName,
	selectedRoleId,
	onRoleChange,
	onSave,
	saveDisabled = false,
	loading,
	saveLoading = false,
	activityLog = [],
}) => {
	return (
		<Space
			direction="vertical"
			size="large"
			style={{ width: '100%' }}
		>
			<Title level={4}>Staff User Details</Title>
			<Descriptions
				title="Identity (read-only)"
				bordered
				size="small"
				column={1}
			>
				<Descriptions.Item label="Display Name">{data.displayName}</Descriptions.Item>
				<Descriptions.Item label="Email">{data.email}</Descriptions.Item>
				<Descriptions.Item label="Created At">{new Date(data.createdAt).toLocaleDateString()}</Descriptions.Item>
			</Descriptions>
			<div>
				<div style={{ marginBottom: 8, fontWeight: 600 }}>Assigned Role</div>
				<Space
					direction="horizontal"
					size="small"
					align="start"
				>
					<Select
						style={{ width: 240 }}
						value={selectedRoleId}
						disabled={!canAssignRoles}
						loading={!!loading}
						onChange={onRoleChange}
						options={availableRoles.map((r) => ({ value: r.id, label: r.roleName }))}
						placeholder={currentRoleName ? `${currentRoleName}` : 'No role assigned'}
					/>
					<Button
						type="primary"
						disabled={!canAssignRoles || saveDisabled}
						loading={!!saveLoading}
						onClick={onSave}
					>
						Save
					</Button>
					{isEditingOwnRole && (
						<div
							title="You cannot change your own assigned role"
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: 24,
								height: 24,
							}}
						></div>
					)}
				</Space>
			</div>
			<div>
				<Title level={5}>Activity Log</Title>
				<Table<ActivityLogEntry>
					dataSource={activityLog.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
					columns={activityLogColumns}
					rowKey={(record) => `${record.activityType}-${record.createdAt}-${record.activityByStaffUserId}`}
					pagination={{ pageSize: 10, showSizeChanger: false }}
					locale={{ emptyText: 'No activity recorded' }}
					size="small"
				/>
			</div>
		</Space>
	);
};
