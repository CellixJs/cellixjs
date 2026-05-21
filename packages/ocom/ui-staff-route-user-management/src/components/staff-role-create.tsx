import { Button, Checkbox, Divider, Form, Input, Select, Space, Typography } from 'antd';
import type React from 'react';

const { Title } = Typography;

export interface StaffRoleFormValues {
	roleName: string;
	enterpriseAppRole: string;
	canManageCommunities: boolean;
	canManageStaffRolesAndPermissions: boolean;
	canManageAllCommunities: boolean;
	canDeleteCommunities: boolean;
	canChangeCommunityOwner: boolean;
	canReIndexSearchCollections: boolean;
	canManageUsers: boolean;
	canAssignStaffRoles: boolean;
	canViewStaffUsers: boolean;
	canViewRoles: boolean;
	canAddRole: boolean;
	canEditRole: boolean;
	canRemoveRole: boolean;
	canManageFinance: boolean;
	canViewGLBatchSummaries: boolean;
	canViewFinanceConfigs: boolean;
	canCreateFinanceConfigs: boolean;
	canManageTechAdmin: boolean;
	canViewDatabaseExplorer: boolean;
	canViewBlobExplorer: boolean;
	canViewQueueDashboard: boolean;
	canSendQueueMessages: boolean;
}

interface StaffRoleCreateProps {
	onSubmit: (values: StaffRoleFormValues) => void;
	onCancel: () => void;
	loading?: boolean;
	availableEnterpriseAppRoles?: string[];
	showTechAdminPermissions?: boolean;
	initialValues?: Partial<StaffRoleFormValues>;
	mode?: 'create' | 'edit';
}

const PERMISSION_GROUPS: Array<{
	title: string;
	techAdminOnly?: boolean;
	fields: Array<{ key: keyof Omit<StaffRoleFormValues, 'roleName' | 'enterpriseAppRole'>; label: string }>;
}> = [
	{
		title: 'Community Permissions',
		fields: [
			{ key: 'canManageCommunities', label: 'Can Manage Communities' },
			{ key: 'canManageStaffRolesAndPermissions', label: 'Can Manage Staff Roles and Permissions' },
			{ key: 'canManageAllCommunities', label: 'Can Manage All Communities' },
			{ key: 'canDeleteCommunities', label: 'Can Delete Communities' },
			{ key: 'canChangeCommunityOwner', label: 'Can Change Community Owner' },
			{ key: 'canReIndexSearchCollections', label: 'Can Reindex Search Collections' },
		],
	},
	{
		title: 'User',
		fields: [
			{ key: 'canManageUsers', label: 'Can Manage Users' },
			{ key: 'canAssignStaffRoles', label: 'Can Assign Staff Roles' },
			{ key: 'canViewStaffUsers', label: 'Can View Staff Users' },
		],
	},
	{
		title: 'Role',
		fields: [
			{ key: 'canViewRoles', label: 'Can View Roles' },
			{ key: 'canAddRole', label: 'Can Add Role' },
			{ key: 'canEditRole', label: 'Can Edit Role' },
			{ key: 'canRemoveRole', label: 'Can Remove Role' },
		],
	},
	{
		title: 'Finance',
		fields: [
			{ key: 'canManageFinance', label: 'Can Manage Finance' },
			{ key: 'canViewGLBatchSummaries', label: 'Can View GL Batch Summaries' },
			{ key: 'canViewFinanceConfigs', label: 'Can View Finance Configs' },
			{ key: 'canCreateFinanceConfigs', label: 'Can Create Finance Configs' },
		],
	},
	{
		title: 'Tech Admin',
		techAdminOnly: true,
		fields: [
			{ key: 'canManageTechAdmin', label: 'Can Manage Tech Admin' },
			{ key: 'canViewDatabaseExplorer', label: 'Can View Database Explorer' },
			{ key: 'canViewBlobExplorer', label: 'Can View Blob Explorer' },
			{ key: 'canViewQueueDashboard', label: 'Can View Queue Dashboard' },
			{ key: 'canSendQueueMessages', label: 'Can Send Queue Messages' },
		],
	},
];

const DEFAULT_VALUES: StaffRoleFormValues = {
	roleName: '',
	enterpriseAppRole: '',
	canManageCommunities: false,
	canManageStaffRolesAndPermissions: false,
	canManageAllCommunities: false,
	canDeleteCommunities: false,
	canChangeCommunityOwner: false,
	canReIndexSearchCollections: false,
	canManageUsers: false,
	canAssignStaffRoles: false,
	canViewStaffUsers: false,
	canViewRoles: false,
	canAddRole: false,
	canEditRole: false,
	canRemoveRole: false,
	canManageFinance: false,
	canViewGLBatchSummaries: false,
	canViewFinanceConfigs: false,
	canCreateFinanceConfigs: false,
	canManageTechAdmin: false,
	canViewDatabaseExplorer: false,
	canViewBlobExplorer: false,
	canViewQueueDashboard: false,
	canSendQueueMessages: false,
};

export const StaffRoleCreate: React.FC<StaffRoleCreateProps> = ({ onSubmit, onCancel, loading, availableEnterpriseAppRoles, showTechAdminPermissions, initialValues, mode = 'create' }) => {
	const [form] = Form.useForm<StaffRoleFormValues>();

	const defaultValues: StaffRoleFormValues = {
		...DEFAULT_VALUES,
		...initialValues,
	};

	const isEdit = mode === 'edit';
	const enterpriseAppRoleOptions = (availableEnterpriseAppRoles ?? []).map((r) => ({ value: r, label: r }));

	return (
		<Space
			direction="vertical"
			size="large"
			style={{ width: '100%', maxWidth: 720 }}
		>
			<Title level={4}>{isEdit ? 'Edit Staff Role' : 'Create Staff Role'}</Title>
			<Form
				form={form}
				layout="vertical"
				initialValues={defaultValues}
				onFinish={onSubmit}
			>
				<Form.Item
					name="roleName"
					label="Role Name"
					rules={[{ required: true, message: 'Role name is required' }]}
				>
					<Input />
				</Form.Item>
				<Form.Item
					name="enterpriseAppRole"
					label="Enterprise App Role"
					rules={[{ required: true, message: 'Enterprise app role is required' }]}
				>
					<Select
						placeholder="Select enterprise app role"
						options={enterpriseAppRoleOptions}
					/>
				</Form.Item>
				<Divider>Permissions</Divider>
				{PERMISSION_GROUPS.filter(({ techAdminOnly }) => !techAdminOnly || showTechAdminPermissions).map((group) => (
					<div key={group.title}>
						<div style={{ marginBottom: 8, fontWeight: 600 }}>{group.title}</div>
						<Space
							direction="vertical"
							size="small"
							style={{ marginBottom: 16 }}
						>
							{group.fields.map(({ key, label }) => (
								<Form.Item
									key={key}
									name={key}
									valuePropName="checked"
								>
									<Checkbox>{label}</Checkbox>
								</Form.Item>
							))}
						</Space>
					</div>
				))}
				<Form.Item>
					<Space>
						<Button
							type="primary"
							htmlType="submit"
							loading={!!loading}
						>
							{isEdit ? 'Update Role' : 'Create Role'}
						</Button>
						<Button onClick={onCancel}>Cancel</Button>
					</Space>
				</Form.Item>
			</Form>
		</Space>
	);
};
