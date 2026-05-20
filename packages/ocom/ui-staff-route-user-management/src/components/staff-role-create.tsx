import { Button, Checkbox, Divider, Form, Input, Select, Space, Typography } from 'antd';
import type React from 'react';

const { Title } = Typography;

export interface StaffRoleFormValues {
	roleName: string;
	enterpriseAppRole: string;
	canManageCommunities: boolean;
	canManageUsers: boolean;
	canManageFinance: boolean;
	canManageTechAdmin: boolean;
	canAssignStaffUserRoles: boolean;
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

const PERMISSION_LABELS: { key: keyof Omit<StaffRoleFormValues, 'roleName' | 'enterpriseAppRole'>; label: string; techAdminOnly?: boolean }[] = [
	{ key: 'canManageCommunities', label: 'Can Manage Communities' },
	{ key: 'canManageUsers', label: 'Can Manage Users' },
	{ key: 'canManageFinance', label: 'Can Manage Finance' },
	{ key: 'canManageTechAdmin', label: 'Can Manage Tech Admin', techAdminOnly: true },
	{ key: 'canAssignStaffUserRoles', label: 'Can Assign Staff User Roles' },
];

export const StaffRoleCreate: React.FC<StaffRoleCreateProps> = ({ onSubmit, onCancel, loading, availableEnterpriseAppRoles, showTechAdminPermissions, initialValues, mode = 'create' }) => {
	const [form] = Form.useForm<StaffRoleFormValues>();

	const defaultValues: StaffRoleFormValues = {
		roleName: '',
		enterpriseAppRole: '',
		canManageCommunities: false,
		canManageUsers: false,
		canManageFinance: false,
		canManageTechAdmin: false,
		canAssignStaffUserRoles: false,
		...initialValues,
	};

	const isEdit = mode === 'edit';
	const enterpriseAppRoleOptions = (availableEnterpriseAppRoles ?? []).map((r) => ({ value: r, label: r }));

	return (
		<Space
			direction="vertical"
			size="large"
			style={{ width: '100%', maxWidth: 600 }}
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
				{PERMISSION_LABELS.filter(({ techAdminOnly }) => !techAdminOnly || showTechAdminPermissions).map(({ key, label }) => (
					<Form.Item
						key={key}
						name={key}
						valuePropName="checked"
					>
						<Checkbox>{label}</Checkbox>
					</Form.Item>
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
