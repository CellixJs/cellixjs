import type React from 'react';
import { useState } from 'react';
import { Card, Row, Col, Typography, Avatar, Button, Space, Tag, Descriptions, Form, Select, Input, Modal, Drawer } from 'antd';
import { UserOutlined, EditOutlined, ReloadOutlined, CloseOutlined, SaveOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { AdminMemberDetailContainerMemberFieldsFragment } from '../../../../generated.tsx';

const { Title, Text } = Typography;

export interface MemberDetailProps {
	member: AdminMemberDetailContainerMemberFieldsFragment | null;
	loading?: boolean;
	isEditing?: boolean;
	onEdit?: () => void;
	onCancelEdit?: () => void;
	onUpdateRole?: (roleId: string, reason: string) => Promise<void>;
	onClose?: () => void;
	onRefresh?: () => void;
}

export const MemberDetail: React.FC<MemberDetailProps> = ({
	member,
	loading = false,
	isEditing = false,
	onEdit,
	//onCancelEdit,
	onUpdateRole,
	onClose,
	onRefresh,
}) => {
	const [form] = Form.useForm();
	const [showRoleModal, setShowRoleModal] = useState(false);

	if (!member) {
		return <div>Member not found</div>;
	}

	// Format member status based on accounts
	const getAccountStatus = () => {
		const activeAccount = member.accounts?.find((account) => account.statusCode === 'ACCEPTED');
		if (activeAccount) {
			return { status: 'Active', color: 'green', icon: <CheckCircleOutlined /> };
		}

		const pendingAccount = member.accounts?.find((account) => account.statusCode === 'CREATED');
		if (pendingAccount) {
			return { status: 'Pending', color: 'orange', icon: <ExclamationCircleOutlined /> };
		}

		return { status: 'Inactive', color: 'red', icon: <ExclamationCircleOutlined /> };
	};

	const accountStatus = getAccountStatus();

	// Handle role update
	const handleRoleUpdate = async (values: { roleId: string; reason: string }) => {
		if (onUpdateRole) {
			await onUpdateRole(values.roleId, values.reason);
			setShowRoleModal(false);
			form.resetFields();
		}
	};

	const handleEditRole = () => {
		setShowRoleModal(true);
		form.setFieldsValue({
			roleId: member.isAdmin ? 'admin-role-id' : 'member-role-id',
			reason: '',
		});
	};

	return (
		<Drawer
			title={
				<Space>
					<Avatar
						size="large"
						icon={<UserOutlined />}
						src={member.profile?.avatarDocumentId ? `/api/documents/${member.profile.avatarDocumentId}` : undefined}
					/>
					<div>
						<Title
							level={4}
							style={{ margin: 0 }}
						>
							{member.profile?.name || member.memberName}
						</Title>
						<Text type="secondary">Member Details</Text>
					</div>
				</Space>
			}
			width={720}
			open={true}
			onClose={onClose}
			extra={
				<Space>
					<Button
						icon={<ReloadOutlined />}
						onClick={onRefresh}
						loading={loading}
					>
						Refresh
					</Button>
					<Button
						type="primary"
						icon={<EditOutlined />}
						onClick={onEdit}
						disabled={isEditing}
					>
						Edit
					</Button>
					<Button
						icon={<CloseOutlined />}
						onClick={onClose}
					>
						Close
					</Button>
				</Space>
			}
		>
			<Space
				direction="vertical"
				size="large"
				style={{ width: '100%' }}
			>
				{/* Member Overview */}
				<Card
					title="Member Overview"
					size="small"
				>
					<Row gutter={[16, 16]}>
						<Col span={12}>
							<Space direction="vertical">
								<div>
									<Text strong>Status</Text>
									<br />
									<Tag
										color={accountStatus.color}
										icon={accountStatus.icon}
									>
										{accountStatus.status}
									</Tag>
								</div>
								<div>
									<Text strong>Member ID</Text>
									<br />
									<Text code>{member.id}</Text>
								</div>
								<div>
									<Text strong>Member Name</Text>
									<br />
									<Text>{member.memberName}</Text>
								</div>
							</Space>
						</Col>
						<Col span={12}>
							<Space direction="vertical">
								<div>
									<Text strong>Role</Text>
									<br />
									<Space>
										<Tag color="blue">{member.isAdmin ? 'Administrator' : 'Member'}</Tag>
										{isEditing && (
											<Button
												type="link"
												size="small"
												icon={<EditOutlined />}
												onClick={handleEditRole}
											>
												Change Role
											</Button>
										)}
									</Space>
								</div>
								<div>
									<Text strong>Community ID</Text>
									<br />
									<Text code>{member.community?.id ?? 'N/A'}</Text>
								</div>
								<div>
									<Text strong>Profile Email</Text>
									<br />
									<Text code>{member.profile?.email ?? 'N/A'}</Text>
								</div>
							</Space>
						</Col>
					</Row>
				</Card>

				{/* Profile Information */}
				{member.profile && (
					<Card
						title="Profile Information"
						size="small"
					>
						<Descriptions
							column={1}
							bordered
							size="small"
						>
							<Descriptions.Item label="Name">{member.profile.name || 'Not set'}</Descriptions.Item>
							<Descriptions.Item label="Email">{member.profile.email || 'Not set'}</Descriptions.Item>
							<Descriptions.Item label="Avatar Document ID">{member.profile.avatarDocumentId || 'Not set'}</Descriptions.Item>
							<Descriptions.Item label="Bio">{member.profile.bio || 'No bio provided'}</Descriptions.Item>
						</Descriptions>
					</Card>
				)}

				{/* Account Information */}
				<Card
					title="Account Information"
					size="small"
				>
					{member.accounts && member.accounts.length > 0 ? (
						<Space
							direction="vertical"
							style={{ width: '100%' }}
						>
							{member.accounts.map((account) => (
								<Card
									key={account.id}
									size="small"
									type="inner"
								>
									<Row gutter={16}>
										<Col span={12}>
											<Space direction="vertical">
												<div>
													<Text strong>Account Name</Text>
													<br />
													<Text>{`${account.firstName} ${account.lastName ?? ''}`.trim()}</Text>
												</div>
											</Space>
										</Col>
										<Col span={12}>
											<Space direction="vertical">
												<div>
													<Text strong>Status</Text>
													<br />
													<Tag color={account.statusCode === 'ACCEPTED' ? 'green' : account.statusCode === 'CREATED' ? 'orange' : 'red'}>{account.statusCode}</Tag>
												</div>
												<div>
													<Text strong>Active</Text>
													<br />
													<Tag color={account.statusCode === 'ACCEPTED' ? 'green' : 'red'}>{account.statusCode === 'ACCEPTED' ? 'Yes' : 'No'}</Tag>
												</div>
											</Space>
										</Col>
									</Row>
								</Card>
							))}
						</Space>
					) : (
						<Text type="secondary">No accounts found</Text>
					)}
				</Card>

				{/* Metadata */}
				<Card
					title="Metadata"
					size="small"
				>
					<Descriptions
						column={1}
						bordered
						size="small"
					>
						<Descriptions.Item label="Created At">{new Date(member.createdAt).toLocaleString()}</Descriptions.Item>
						<Descriptions.Item label="Updated At">{new Date(member.updatedAt).toLocaleString()}</Descriptions.Item>
					</Descriptions>
				</Card>
			</Space>

			{/* Role Update Modal */}
			<Modal
				title="Update Member Role"
				open={showRoleModal}
				onCancel={() => {
					setShowRoleModal(false);
					form.resetFields();
				}}
				footer={null}
				destroyOnClose
			>
				<Form
					form={form}
					layout="vertical"
					onFinish={handleRoleUpdate}
				>
					<Form.Item
						name="roleId"
						label="Role"
						rules={[{ required: true, message: 'Please select a role' }]}
					>
						<Select placeholder="Select a role">
							{/* TODO: Load available roles from context or API */}
							<Select.Option value="admin-role-id">Administrator</Select.Option>
							<Select.Option value="member-role-id">Member</Select.Option>
							<Select.Option value="moderator-role-id">Moderator</Select.Option>
						</Select>
					</Form.Item>

					<Form.Item
						name="reason"
						label="Reason for Change"
						rules={[{ required: true, message: 'Please provide a reason' }]}
					>
						<Input.TextArea
							placeholder="Explain why the role is being changed..."
							rows={3}
						/>
					</Form.Item>

					<Form.Item>
						<Space>
							<Button
								type="primary"
								htmlType="submit"
								icon={<SaveOutlined />}
								loading={loading}
							>
								Update Role
							</Button>
							<Button
								onClick={() => {
									setShowRoleModal(false);
									form.resetFields();
								}}
							>
								Cancel
							</Button>
						</Space>
					</Form.Item>
				</Form>
			</Modal>
		</Drawer>
	);
};
