import { Badge, Button, Table, Tag, Typography, Space, Tooltip, Modal, Input, Select, Row, Col, Card } from 'antd';
import { UserOutlined, MailOutlined, CrownOutlined, PlayCircleOutlined, PauseCircleOutlined, DeleteOutlined, SearchOutlined, ClearOutlined, EyeOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { TableProps } from 'antd';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../generated.tsx';
import { MemberDetailContainer } from './member-detail.container.tsx';

const { Text } = Typography;
const { TextArea } = Input;

export interface MemberListProps {
	data: AdminMemberListContainerMemberFieldsFragment[];
	communityId?: string;
	onActivateMember: (memberId: string) => Promise<void>;
	onDeactivateMember: (memberId: string, reason?: string) => Promise<void>;
	onRemoveMember: (memberId: string, reason?: string) => Promise<void>;
	onBulkActivateMembers?: (memberIds: string[]) => Promise<void>;
	onBulkDeactivateMembers?: (memberIds: string[], reason: string) => Promise<void>;
	onBulkRemoveMembers?: (memberIds: string[], reason: string) => Promise<void>;
	onInviteMember?: () => void;
	loading?: boolean;
}

export const MemberList: React.FC<MemberListProps> = (props) => {
	const { data, onActivateMember, onDeactivateMember, onRemoveMember, onBulkActivateMembers, onBulkDeactivateMembers, onBulkRemoveMembers, onInviteMember, loading } = props;
	const [actionModalVisible, setActionModalVisible] = useState(false);
	const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'remove' | 'bulkActivate' | 'bulkDeactivate' | 'bulkRemove' | null>(null);
	const [selectedMember, setSelectedMember] = useState<AdminMemberListContainerMemberFieldsFragment | null>(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [reason, setReason] = useState('');

	// Search and Filter State
	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [roleFilter, setRoleFilter] = useState<string>('all');

	// Detail view state
	const [detailMemberId, setDetailMemberId] = useState<string | null>(null);

	const formatDate = (value?: string | null): string => {
		if (!value) {
			return 'N/A';
		}

		const parsedDate = new Date(value);
		if (Number.isNaN(parsedDate.getTime())) {
			return 'N/A';
		}

		return parsedDate.toLocaleDateString();
	};

	const getMemberStatus = (member: AdminMemberListContainerMemberFieldsFragment) => {
		const hasActiveAccount = member.accounts?.some((account) => account.statusCode === 'ACCEPTED');
		return hasActiveAccount ? 'active' : 'inactive';
	};

	const filteredData =
		data?.filter((member) => {
			// Search filter
			if (searchText) {
				const searchLower = searchText.toLowerCase();
				const memberName = (member.profile?.name || member.memberName || '').toLowerCase();
				const email = (member.profile?.email || '').toLowerCase();
				const accountNames = member.accounts?.map((account) => `${account.firstName} ${account.lastName}`.toLowerCase()).join(' ') || '';

				const matchesSearch = memberName.includes(searchLower) || email.includes(searchLower) || accountNames.includes(searchLower);

				if (!matchesSearch) return false;
			}

			// Status filter
			if (statusFilter !== 'all') {
				const memberStatus = getMemberStatus(member);
				if (memberStatus !== statusFilter) return false;
			}

			// Role filter
			if (roleFilter !== 'all') {
				const { isAdmin } = member;
				if (roleFilter === 'admin' && !isAdmin) return false;
				if (roleFilter === 'member' && isAdmin) return false;
			}

			return true;
		}) || [];

	const handleClearFilters = () => {
		setSearchText('');
		setStatusFilter('all');
		setRoleFilter('all');
	};

	const openActionModal = (member: AdminMemberListContainerMemberFieldsFragment, action: 'activate' | 'deactivate' | 'remove') => {
		setSelectedMember(member);
		setActionType(action);
		setActionModalVisible(true);
		setReason('');
	};

	const handleConfirmAction = async () => {
		if (!actionType) return;

		try {
			switch (actionType) {
				case 'activate':
					if (selectedMember) {
						await onActivateMember(selectedMember.id);
					}
					break;
				case 'deactivate':
					if (selectedMember) {
						await onDeactivateMember(selectedMember.id, reason || undefined);
					}
					break;
				case 'remove':
					if (selectedMember) {
						await onRemoveMember(selectedMember.id, reason || undefined);
					}
					break;
				case 'bulkActivate':
					if (onBulkActivateMembers && selectedRowKeys.length > 0) {
						await onBulkActivateMembers(selectedRowKeys as string[]);
					}
					break;
				case 'bulkDeactivate':
					if (onBulkDeactivateMembers && selectedRowKeys.length > 0) {
						await onBulkDeactivateMembers(selectedRowKeys as string[], reason || 'Bulk deactivation');
					}
					break;
				case 'bulkRemove':
					if (onBulkRemoveMembers && selectedRowKeys.length > 0) {
						await onBulkRemoveMembers(selectedRowKeys as string[], reason || 'Bulk removal');
					}
					break;
			}
			setActionModalVisible(false);
			setSelectedMember(null);
			setActionType(null);
			setSelectedRowKeys([]);
			setReason('');
		} catch (_error) {
			// Error handling is done in the container
		}
	};

	const getActionModalTitle = () => {
		if (!actionType) return '';

		const memberName = selectedMember?.profile?.name || selectedMember?.memberName || 'Unknown Member';
		const selectedCount = selectedRowKeys.length;

		switch (actionType) {
			case 'activate':
				return `Activate ${memberName}`;
			case 'deactivate':
				return `Deactivate ${memberName}`;
			case 'remove':
				return `Remove ${memberName}`;
			case 'bulkActivate':
				return `Activate ${selectedCount} Member${selectedCount === 1 ? '' : 's'}`;
			case 'bulkDeactivate':
				return `Deactivate ${selectedCount} Member${selectedCount === 1 ? '' : 's'}`;
			case 'bulkRemove':
				return `Remove ${selectedCount} Member${selectedCount === 1 ? '' : 's'}`;
			default:
				return '';
		}
	};

	const getActionModalContent = () => {
		if (!actionType) return null;

		const memberName = selectedMember?.profile?.name || selectedMember?.memberName || 'Unknown Member';
		const selectedCount = selectedRowKeys.length;

		switch (actionType) {
			case 'activate':
				return (
					<p>
						Are you sure you want to activate <strong>{memberName}</strong>? This will restore their access to the community.
					</p>
				);
			case 'deactivate':
				return (
					<div>
						<p>
							Are you sure you want to deactivate <strong>{memberName}</strong>? This will suspend their access to the community.
						</p>
						<div className="mt-4">
							<Text strong>Reason (optional):</Text>
							<TextArea
								rows={3}
								value={reason}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
								placeholder="Enter a reason for deactivation..."
							/>
						</div>
					</div>
				);
			case 'remove':
				return (
					<div>
						<p className="text-red-600">
							<strong>Warning:</strong> Are you sure you want to permanently remove <strong>{memberName}</strong> from this community? This action cannot be undone.
						</p>
						<div className="mt-4">
							<Text strong>Reason (optional):</Text>
							<TextArea
								rows={3}
								value={reason}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
								placeholder="Enter a reason for removal..."
							/>
						</div>
					</div>
				);
			case 'bulkActivate':
				return (
					<p>
						Are you sure you want to activate <strong>{selectedCount}</strong> member{selectedCount === 1 ? '' : 's'}? This will restore their access to the community.
					</p>
				);
			case 'bulkDeactivate':
				return (
					<div>
						<p>
							Are you sure you want to deactivate <strong>{selectedCount}</strong> member{selectedCount === 1 ? '' : 's'}? This will suspend their access to the community.
						</p>
						<div className="mt-4">
							<Text strong>Reason:</Text>
							<TextArea
								rows={3}
								value={reason}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
								placeholder="Enter a reason for bulk deactivation..."
								required
							/>
						</div>
					</div>
				);
			case 'bulkRemove':
				return (
					<div>
						<p className="text-red-600">
							<strong>Warning:</strong> Are you sure you want to permanently remove <strong>{selectedCount}</strong> member{selectedCount === 1 ? '' : 's'} from this community? This action cannot be undone.
						</p>
						<div className="mt-4">
							<Text strong>Reason:</Text>
							<TextArea
								rows={3}
								value={reason}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
								placeholder="Enter a reason for bulk removal..."
								required
							/>
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	const columns: TableProps<AdminMemberListContainerMemberFieldsFragment>['columns'] = [
		{
			title: 'Member',
			key: 'member',
			render: (_: unknown, record: AdminMemberListContainerMemberFieldsFragment) => {
				const primaryAccount = record.accounts?.[0];
				const displayName = record.profile?.name || primaryAccount?.firstName || record.memberName || 'Unknown';
				const email = record.profile?.email;

				return (
					<div>
						<div className="flex items-center gap-2">
							<UserOutlined className="text-gray-500" />
							<Text strong>{displayName}</Text>
							{record.isAdmin && (
								<Tooltip title="Community Administrator">
									<CrownOutlined className="text-yellow-500" />
								</Tooltip>
							)}
						</div>
						{email && record.profile?.showEmail && (
							<div className="flex items-center gap-1 text-sm text-gray-500">
								<MailOutlined />
								{email}
							</div>
						)}
					</div>
				);
			},
		},
		{
			title: 'Accounts',
			key: 'accounts',
			render: (_: unknown, record: AdminMemberListContainerMemberFieldsFragment) => (
				<div className="space-y-1">
					{record.accounts?.length ? (
						record.accounts.map((account) => (
							<div
								key={account.id}
								className="flex items-center gap-2"
							>
								<Text>
									{account.firstName} {account.lastName}
								</Text>
								<Badge
									status={account.statusCode === 'ACCEPTED' ? 'success' : account.statusCode === 'REJECTED' ? 'error' : 'processing'}
									text={account.statusCode || 'UNKNOWN'}
								/>
							</div>
						))
					) : (
						<Text type="secondary">No accounts</Text>
					)}
				</div>
			),
		},
		{
			title: 'Status',
			key: 'status',
			render: (_: unknown, record: AdminMemberListContainerMemberFieldsFragment) => {
				const status = getMemberStatus(record);
				return <Tag color={status === 'active' ? 'green' : 'orange'}>{status === 'active' ? 'Active' : 'Inactive'}</Tag>;
			},
		},
		{
			title: 'Member Since',
			key: 'createdAt',
			render: (_: unknown, record: AdminMemberListContainerMemberFieldsFragment) => <Text type="secondary">{formatDate(record.createdAt as string | null | undefined)}</Text>,
		},
		{
			title: 'Actions',
			key: 'actions',
			render: (_: unknown, record: AdminMemberListContainerMemberFieldsFragment) => {
				const status = getMemberStatus(record);

				return (
					<Space size="small">
						<Tooltip title="View member details">
							<Button
								size="small"
								type="link"
								icon={<EyeOutlined />}
								onClick={() => setDetailMemberId(record.id)}
							>
								View
							</Button>
						</Tooltip>

						{!record.isAdmin && (
							<>
								{status === 'active' ? (
									<Tooltip title="Deactivate member">
										<Button
											size="small"
											type="link"
											icon={<PauseCircleOutlined />}
											loading={loading}
											onClick={() => openActionModal(record, 'deactivate')}
										>
											Deactivate
										</Button>
									</Tooltip>
								) : (
									<Tooltip title="Activate member">
										<Button
											size="small"
											type="link"
											icon={<PlayCircleOutlined />}
											loading={loading}
											onClick={() => openActionModal(record, 'activate')}
										>
											Activate
										</Button>
									</Tooltip>
								)}

								<Tooltip title="Remove member permanently">
									<Button
										size="small"
										type="link"
										danger
										icon={<DeleteOutlined />}
										loading={loading}
										onClick={() => openActionModal(record, 'remove')}
									>
										Remove
									</Button>
								</Tooltip>
							</>
						)}
					</Space>
				);
			},
		},
	];

	const handleBulkAction = (action: 'bulkActivate' | 'bulkDeactivate' | 'bulkRemove') => {
		if (selectedRowKeys.length === 0) return;
		setActionType(action);
		setActionModalVisible(true);
	};

	const rowSelection: TableProps<AdminMemberListContainerMemberFieldsFragment>['rowSelection'] = {
		selectedRowKeys,
		onChange: setSelectedRowKeys,
		getCheckboxProps: (record) => ({
			disabled: false,
			name: record.id,
		}),
	};

	const bulkActionToolbar = selectedRowKeys.length > 0 && (
		<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
			<span className="text-blue-700">
				{selectedRowKeys.length} member{selectedRowKeys.length === 1 ? '' : 's'} selected
			</span>
			<Space>
				<Button
					icon={<PlayCircleOutlined />}
					onClick={() => handleBulkAction('bulkActivate')}
					size="small"
				>
					Activate
				</Button>
				<Button
					icon={<PauseCircleOutlined />}
					onClick={() => handleBulkAction('bulkDeactivate')}
					size="small"
				>
					Deactivate
				</Button>
				<Button
					icon={<DeleteOutlined />}
					onClick={() => handleBulkAction('bulkRemove')}
					danger
					size="small"
				>
					Remove
				</Button>
				<Button
					onClick={() => setSelectedRowKeys([])}
					size="small"
				>
					Clear Selection
				</Button>
			</Space>
		</div>
	);

	return (
		<div>
			<div className="mb-4 flex justify-between items-center">
				<Typography.Title level={4}>Community Members ({data?.length || 0})</Typography.Title>
				<Button
					type="primary"
					icon={<UserOutlined />}
					onClick={onInviteMember}
				>
					Invite Member
				</Button>
			</div>

			{/* Search and Filter Controls */}
			<Card
				className="mb-4"
				size="small"
			>
				<Row
					gutter={[16, 16]}
					align="middle"
				>
					<Col
						xs={24}
						sm={12}
						md={8}
						lg={6}
					>
						<Input
							placeholder="Search members..."
							prefix={<SearchOutlined />}
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							allowClear
						/>
					</Col>
					<Col
						xs={12}
						sm={6}
						md={4}
						lg={3}
					>
						<Select
							placeholder="Status"
							value={statusFilter}
							onChange={setStatusFilter}
							style={{ width: '100%' }}
						>
							<Select.Option value="all">All Status</Select.Option>
							<Select.Option value="active">Active</Select.Option>
							<Select.Option value="inactive">Inactive</Select.Option>
						</Select>
					</Col>
					<Col
						xs={12}
						sm={6}
						md={4}
						lg={3}
					>
						<Select
							placeholder="Role"
							value={roleFilter}
							onChange={setRoleFilter}
							style={{ width: '100%' }}
						>
							<Select.Option value="all">All Roles</Select.Option>
							<Select.Option value="admin">Admin</Select.Option>
							<Select.Option value="member">Member</Select.Option>
						</Select>
					</Col>
					<Col
						xs={24}
						sm={12}
						md={8}
						lg={12}
					>
						<Space>
							<Button
								icon={<ClearOutlined />}
								onClick={handleClearFilters}
								disabled={searchText === '' && statusFilter === 'all' && roleFilter === 'all'}
							>
								Clear Filters
							</Button>
							<Text type="secondary">
								{filteredData.length} of {data?.length || 0} members
							</Text>
						</Space>
					</Col>
				</Row>
			</Card>

			{bulkActionToolbar}

			<Table
				columns={columns}
				dataSource={filteredData}
				rowKey="id"
				rowSelection={rowSelection}
				pagination={{
					pageSize: 10,
					showSizeChanger: true,
					showQuickJumper: true,
					showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} members`,
				}}
			/>

			<Modal
				title={getActionModalTitle()}
				open={actionModalVisible}
				onOk={handleConfirmAction}
				onCancel={() => {
					setActionModalVisible(false);
					setSelectedMember(null);
					setActionType(null);
					setReason('');
				}}
				confirmLoading={loading}
				okText="Confirm"
				cancelText="Cancel"
				okButtonProps={{
					danger: actionType === 'remove',
				}}
			>
				{getActionModalContent()}
			</Modal>

			{/* Member Detail View */}
			{detailMemberId && (
				<MemberDetailContainer
					memberId={detailMemberId}
					communityId={props.communityId ?? ''}
					onClose={() => setDetailMemberId(null)}
				/>
			)}
		</div>
	);
};
