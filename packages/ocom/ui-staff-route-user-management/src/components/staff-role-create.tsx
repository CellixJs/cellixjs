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
	canViewDatabaseDocuments: boolean;
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

type PermissionFieldKey = keyof Omit<StaffRoleFormValues, 'roleName' | 'enterpriseAppRole'>;

const PERMISSION_GROUPS: Array<{
	title: string;
	techAdminOnly?: boolean;
	topLevelKey: PermissionFieldKey;
	fields: Array<{ key: PermissionFieldKey; label: string }>;
}> = [
	{
		title: 'Community Permissions',
		topLevelKey: 'canManageCommunities',
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
		topLevelKey: 'canManageUsers',
		fields: [
			{ key: 'canManageUsers', label: 'Can Manage Users' },
			{ key: 'canAssignStaffRoles', label: 'Can Assign Staff Roles' },
			{ key: 'canViewStaffUsers', label: 'Can View Staff Users' },
		],
	},
	{
		title: 'Staff Roles',
		topLevelKey: 'canViewRoles',
		fields: [
			{ key: 'canViewRoles', label: 'Can View Staff Roles' },
			{ key: 'canAddRole', label: 'Can Add Staff Role' },
			{ key: 'canEditRole', label: 'Can Edit Staff Role' },
			{ key: 'canRemoveRole', label: 'Can Remove Staff Role' },
		],
	},
	{
		title: 'Finance',
		topLevelKey: 'canManageFinance',
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
		topLevelKey: 'canManageTechAdmin',
		fields: [
			{ key: 'canManageTechAdmin', label: 'Can Manage Tech Admin' },
			{ key: 'canViewDatabaseDocuments', label: 'Can View Database Documents' },
			{ key: 'canViewBlobExplorer', label: 'Can View Blob Explorer' },
			{ key: 'canViewQueueDashboard', label: 'Can View Queue Dashboard' },
			{ key: 'canSendQueueMessages', label: 'Can Send Queue Messages' },
		],
	},
];

const normalizePermissionHierarchy = (values: StaffRoleFormValues): StaffRoleFormValues => {
	const normalized = { ...values };

	for (const group of PERMISSION_GROUPS) {
		const shouldEnableTopLevel = group.fields.slice(1).some(({ key }) => normalized[key]);
		if (shouldEnableTopLevel) {
			normalized[group.topLevelKey] = true;
		}
	}

	return normalized;
};

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
	canViewDatabaseDocuments: false,
	canViewBlobExplorer: false,
	canViewQueueDashboard: false,
	canSendQueueMessages: false,
};

export const StaffRoleCreate: React.FC<StaffRoleCreateProps> = ({ onSubmit, onCancel, loading, availableEnterpriseAppRoles, showTechAdminPermissions, initialValues, mode = 'create' }) => {
	const [form] = Form.useForm<StaffRoleFormValues>();

	const defaultValues: StaffRoleFormValues = {
		...normalizePermissionHierarchy({ ...DEFAULT_VALUES, ...initialValues }),
	};

	const isEdit = mode === 'edit';
	const enterpriseAppRoleOptions = (availableEnterpriseAppRoles ?? []).map((r) => ({ value: r, label: r }));

	const handleValuesChange = (_changedValues: Partial<StaffRoleFormValues>, allValues: StaffRoleFormValues) => {
		const normalizedValues = normalizePermissionHierarchy(allValues);
		const hasHierarchyChange = PERMISSION_GROUPS.some((group) => {
			const topLevelIsFalse = normalizedValues[group.topLevelKey] !== allValues[group.topLevelKey];
			const childSelected = group.fields.slice(1).some(({ key }) => allValues[key]);
			return topLevelIsFalse && childSelected;
		});

		if (hasHierarchyChange) {
			form.setFieldsValue(normalizedValues);
		}
	};

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
				onValuesChange={handleValuesChange}
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
						<div style={{ marginBottom: 6, fontWeight: 600 }}>{group.title}</div>
						{/* compact two-column layout for permission checkboxes */}
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4px 12px', marginBottom: 12 }}>
							{group.fields.map(({ key, label }) => (
								<Form.Item
									key={key}
									name={key}
									valuePropName="checked"
									style={{ margin: 0 }}
								>
									<Checkbox>{label}</Checkbox>
								</Form.Item>
							))}
						</div>
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
