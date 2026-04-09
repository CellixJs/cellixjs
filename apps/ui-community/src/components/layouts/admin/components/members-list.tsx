import { SearchOutlined } from '@ant-design/icons';
import { Button, Input, Select, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo, useState } from 'react';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../generated.tsx';

const { Title, Text } = Typography;

type MemberStatusFilter = 'all' | 'active' | 'invited' | 'inactive' | 'unknown';

const getMemberStatus = (member: AdminMemberListContainerMemberFieldsFragment): MemberStatusFilter => {
	const normalizedStatuses = member.accounts
		.map((account) => account.statusCode?.toUpperCase())
		.filter((status): status is string => Boolean(status));

	if (normalizedStatuses.some((status) => ['ACCEPTED', 'ACTIVE'].includes(status))) {
		return 'active';
	}

	if (normalizedStatuses.some((status) => ['CREATED', 'PENDING', 'INVITED'].includes(status))) {
		return 'invited';
	}

	if (normalizedStatuses.some((status) => ['INACTIVE', 'DEACTIVATED', 'REMOVED'].includes(status))) {
		return 'inactive';
	}

	return 'unknown';
};

const statusDisplayMap: Record<MemberStatusFilter, { label: string; color: string }> = {
	all: { label: 'All', color: 'default' },
	active: { label: 'Active', color: 'green' },
	invited: { label: 'Invited', color: 'gold' },
	inactive: { label: 'Inactive', color: 'red' },
	unknown: { label: 'Unknown', color: 'default' },
};

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

export const MemberList: React.FC<MemberListProps> = (props) => {
	const {
		data,
		onInviteMember,
		onMemberEdit,
		onRemoveMember,
		onBulkActivateMembers,
		onBulkDeactivateMembers,
		onBulkRemoveMembers,
		loading,
	} = props;
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>('all');
	const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

	const filteredData = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();
		return data.filter((member) => {
			const matchesSearch =
				normalizedSearch.length === 0 ||
				member.memberName?.toLowerCase().includes(normalizedSearch) ||
				member.profile?.email?.toLowerCase().includes(normalizedSearch);
			const memberStatus = getMemberStatus(member);
			const matchesStatus = statusFilter === 'all' || memberStatus === statusFilter;
			return matchesSearch && matchesStatus;
		});
	}, [data, searchTerm, statusFilter]);

	const clearSelection = () => setSelectedMemberIds([]);

	const handleBulkActivate = async () => {
		await onBulkActivateMembers?.(selectedMemberIds);
		clearSelection();
	};

	const handleBulkDeactivate = async () => {
		await onBulkDeactivateMembers?.(selectedMemberIds, 'Bulk deactivation from member list');
		clearSelection();
	};

	const handleBulkRemove = async () => {
		await onBulkRemoveMembers?.(selectedMemberIds, 'Bulk remove from member list');
		clearSelection();
	};

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
			title: 'Status',
			key: 'status',
			render: (_text: unknown, record: AdminMemberListContainerMemberFieldsFragment) => {
				const status = getMemberStatus(record);
				return <Tag color={statusDisplayMap[status].color}>{statusDisplayMap[status].label}</Tag>;
			},
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
				<Space size="small">
					<Button
						type="link"
						onClick={() => onMemberEdit?.(record.id)}
					>
						Edit
					</Button>
					<Button
						type="link"
						danger
						onClick={() => onRemoveMember?.(record.id, 'Removed from member list')}
					>
						Remove
					</Button>
				</Space>
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
				<Title level={3}>Community Members ({filteredData.length})</Title>
				<Space>
					<Button
						type="primary"
						onClick={onInviteMember}
					>
						Invite Member
					</Button>
				</Space>
			</div>
			<Space
				wrap
				size="middle"
			>
				<Input
					placeholder="Search by member name or email"
					prefix={<SearchOutlined />}
					allowClear
					value={searchTerm}
					onChange={(event) => setSearchTerm(event.target.value)}
					style={{ width: 320 }}
				/>
				<Select
					value={statusFilter}
					onChange={(value) => setStatusFilter(value)}
					options={[
						{ value: 'all', label: 'All statuses' },
						{ value: 'active', label: 'Active' },
						{ value: 'invited', label: 'Invited' },
						{ value: 'inactive', label: 'Inactive' },
						{ value: 'unknown', label: 'Unknown' },
					]}
					style={{ width: 180 }}
				/>
			</Space>
			{selectedMemberIds.length > 0 && (
				<Space
					wrap
					size="small"
					style={{ justifyContent: 'space-between', width: '100%' }}
				>
					<Text strong>Selected members: {selectedMemberIds.length}</Text>
					<Space size="small">
						<Button
							onClick={handleBulkActivate}
							loading={loading}
						>
							Activate Selected
						</Button>
						<Button
							onClick={handleBulkDeactivate}
							loading={loading}
						>
							Deactivate Selected
						</Button>
						<Button
							danger
							onClick={handleBulkRemove}
							loading={loading}
						>
							Remove Selected
						</Button>
						<Button onClick={clearSelection}>Clear Selection</Button>
					</Space>
				</Space>
			)}
			<Table
				dataSource={filteredData}
				columns={columns}
				rowKey="id"
				loading={loading}
				rowSelection={{
					selectedRowKeys: selectedMemberIds,
					onChange: (selectedRowKeys) => setSelectedMemberIds(selectedRowKeys.map((key) => String(key))),
				}}
				pagination={{
					pageSize: 10,
					showSizeChanger: true,
					showQuickJumper: true,
					showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} filtered members`,
				}}
			/>
		</Space>
	);
};
