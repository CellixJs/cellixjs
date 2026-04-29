import { SearchOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { AdminMemberListContainerMemberFieldsFragment } from '../generated.tsx';

const { Title, Text } = Typography;

type MemberStatusFilter = 'all' | 'active' | 'invited' | 'inactive' | 'unknown';
type BulkActionType = 'deactivate' | 'remove';
type BulkActionFormValues = {
	reason?: string;
};

const getMemberStatus = (member: AdminMemberListContainerMemberFieldsFragment): MemberStatusFilter => {
	const normalizedStatuses = member.accounts.map((account) => account.statusCode?.toUpperCase()).filter((status): status is string => Boolean(status));

	if (normalizedStatuses.length === 0) {
		return 'invited';
	}

	if (normalizedStatuses.some((status) => ['ACCEPTED', 'ACTIVE'].includes(status))) {
		return 'active';
	}

	if (normalizedStatuses.some((status) => ['CREATED', 'PENDING', 'INVITED'].includes(status))) {
		return 'invited';
	}

	if (normalizedStatuses.some((status) => ['INACTIVE', 'DEACTIVATED', 'REMOVED', 'REJECTED'].includes(status))) {
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
	currentMemberId?: string | null;
	onActivateMember?: (memberId: string, reason?: string) => Promise<void>;
	onDeactivateMember?: (memberId: string, reason?: string) => Promise<void>;
	onRemoveMember?: (memberId: string, reason?: string) => Promise<boolean>;
	onBulkActivateMembers?: (memberIds: string[]) => Promise<boolean>;
	onBulkDeactivateMembers?: (memberIds: string[], reason?: string) => Promise<boolean>;
	onBulkRemoveMembers?: (memberIds: string[], reason?: string) => Promise<boolean>;
	onInviteMember?: () => void;
	onMemberEdit?: (memberId: string) => void;
	loading?: boolean;
}

export const MemberList: React.FC<MemberListProps> = (props) => {
	const { data, currentMemberId, onInviteMember, onMemberEdit, onActivateMember, onDeactivateMember, onRemoveMember, onBulkActivateMembers, onBulkDeactivateMembers, onBulkRemoveMembers, loading } = props;
	const isLoading = loading ?? false;
	const [bulkActionForm] = Form.useForm<BulkActionFormValues>();
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>('all');
	const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
	const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false);
	const [bulkActionType, setBulkActionType] = useState<BulkActionType>('deactivate');

	const filteredData = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();
		return data.filter((member) => {
			const matchesSearch = normalizedSearch.length === 0 || member.memberName?.toLowerCase().includes(normalizedSearch) || member.profile?.email?.toLowerCase().includes(normalizedSearch);
			const memberStatus = getMemberStatus(member);
			const matchesStatus = statusFilter === 'all' || memberStatus === statusFilter;
			return matchesSearch && matchesStatus;
		});
	}, [data, searchTerm, statusFilter]);

	const clearSelection = () => setSelectedMemberIds([]);

	const handleBulkActivate = async () => {
		const success = await onBulkActivateMembers?.(selectedMemberIds);
		if (success) {
			clearSelection();
		}
	};

	const closeBulkActionModal = () => {
		setBulkActionModalOpen(false);
		bulkActionForm.resetFields();
	};

	const handleBulkActionSubmit = async (values: BulkActionFormValues) => {
		const reason = values.reason?.trim();
		const success = bulkActionType === 'deactivate'
			? await onBulkDeactivateMembers?.(selectedMemberIds, reason ? reason : undefined)
			: await onBulkRemoveMembers?.(selectedMemberIds, reason ? reason : undefined);
		if (success) {
			clearSelection();
			closeBulkActionModal();
		}
	};

	const openBulkActionModal = (action: BulkActionType) => {
		setBulkActionType(action);
		bulkActionForm.resetFields();
		setBulkActionModalOpen(true);
	};

	const handleRemoveMember = async (memberId: string) => {
		await onRemoveMember?.(memberId, 'Removed from member list');
	};

	const handleActivateMember = async (memberId: string) => {
		await onActivateMember?.(memberId, 'Activated from member list');
	};

	const handleDeactivateMember = async (memberId: string) => {
		await onDeactivateMember?.(memberId, 'Deactivated from member list');
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
			render: (_text: unknown, record: AdminMemberListContainerMemberFieldsFragment) => {
				const status = getMemberStatus(record);
				const isCurrentMember = currentMemberId != null && String(record.id) === currentMemberId;
				return (
					<Space size="small">
						<Button
							type="link"
							onClick={() => onMemberEdit?.(record.id)}
						>
							Edit
						</Button>
						{status === 'active' ? (
							<Button
								type="link"
								loading={isLoading}
								disabled={isCurrentMember}
								onClick={() => void handleDeactivateMember(String(record.id))}
							>
								Deactivate
							</Button>
						) : (
							<Button
								type="link"
								loading={isLoading}
								onClick={() => void handleActivateMember(String(record.id))}
							>
								Activate
							</Button>
						)}
						<Button
							type="link"
							danger
							loading={isLoading}
							disabled={isCurrentMember}
							onClick={() => void handleRemoveMember(String(record.id))}
						>
							Remove
						</Button>
					</Space>
				);
			},
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
							loading={isLoading}
						>
							Activate Selected
						</Button>
						<Button
							onClick={() => openBulkActionModal('deactivate')}
							loading={isLoading}
						>
							Deactivate Selected
						</Button>
						<Button
							danger
							onClick={() => openBulkActionModal('remove')}
							loading={isLoading}
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
				loading={isLoading}
				rowSelection={{
					selectedRowKeys: selectedMemberIds,
					onChange: (selectedRowKeys) => setSelectedMemberIds(selectedRowKeys.map((key) => String(key))),
					getCheckboxProps: (record: AdminMemberListContainerMemberFieldsFragment) => ({
						disabled: currentMemberId != null && String(record.id) === currentMemberId,
					}),
				}}
				pagination={{
					pageSize: 10,
					showSizeChanger: true,
					showQuickJumper: true,
					showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} filtered members`,
				}}
			/>
			<Modal
				open={bulkActionModalOpen}
				title={bulkActionType === 'deactivate' ? 'Deactivate selected members?' : 'Remove selected members?'}
				okText={bulkActionType === 'deactivate' ? 'Deactivate Members' : 'Remove Members'}
				okButtonProps={bulkActionType === 'remove' ? { danger: true } : {}}
				confirmLoading={isLoading}
				onCancel={closeBulkActionModal}
				onOk={() => void bulkActionForm.submit()}
			>
				<Space
					direction="vertical"
					size="small"
					style={{ width: '100%' }}
				>
					<Text>
						{bulkActionType === 'deactivate'
							? `This will deactivate ${selectedMemberIds.length} selected member(s).`
							: `This will remove ${selectedMemberIds.length} selected member(s).`}
					</Text>
					<Form
						form={bulkActionForm}
						layout="vertical"
						onFinish={handleBulkActionSubmit}
					>
						<Form.Item name="reason">
							<Input.TextArea
								placeholder="Optional reason for audit log"
								rows={3}
								maxLength={500}
								showCount
							/>
						</Form.Item>
					</Form>
				</Space>
			</Modal>
		</Space>
	);
};
