import { Button, Space, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../generated.tsx';

const { Title } = Typography;

export interface MemberListProps {
	data: AdminMemberListContainerMemberFieldsFragment[];
	communityId?: string;
	onActivateMember?: (memberId: string, reason?: string) => Promise<void>;
	onDeactivateMember?: (memberId: string, reason?: string) => Promise<void>;
	onRemoveMember?: (memberId: string, reason?: string) => Promise<void>;
	onBulkActivateMembers?: (memberIds: string[]) => Promise<void>;
	onBulkDeactivateMembers?: (memberIds: string[], reason: string) => Promise<void>;
	onBulkRemoveMembers?: (memberIds: string[], reason: string) => Promise<void>;
	onInviteMember?: () => void;
	onMemberEdit?: (memberId: string) => void;
	loading?: boolean;
}

export const MemberList: React.FC<MemberListProps> = ({ data, onInviteMember, onMemberEdit }) => {
	const columns: TableColumnsType<AdminMemberListContainerMemberFieldsFragment> = [
		{
			title: 'Member Name',
			dataIndex: 'memberName',
			key: 'memberName',
		},
		{
			title: 'Role',
			dataIndex: ['role', 'roleName'],
			key: 'role',
			render: (roleName: string) => roleName || 'No Role',
		},
		{
			title: 'Created',
			dataIndex: 'createdAt',
			key: 'createdAt',
			render: (date: string) => {
				if (!date) return 'N/A';
				return new Date(date).toLocaleDateString();
			},
		},
		{
			title: 'Updated',
			dataIndex: 'updatedAt',
			key: 'updatedAt',
			render: (date: string) => {
				if (!date) return 'N/A';
				return new Date(date).toLocaleDateString();
			},
		},
		{
			title: 'Action',
			key: 'action',
			render: (_text: unknown, record: AdminMemberListContainerMemberFieldsFragment) => (
				<Button
					type="link"
					onClick={() => onMemberEdit?.(record.id)}
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
				<Title level={3}>Community Members ({data.length})</Title>
				<Button
					type="primary"
					onClick={onInviteMember}
				>
					Invite Member
				</Button>
			</div>
			<Table
				dataSource={data}
				columns={columns}
				rowKey="id"
				pagination={{
					pageSize: 10,
					showSizeChanger: true,
					showQuickJumper: true,
					showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} members`,
				}}
			/>
		</Space>
	);
};
