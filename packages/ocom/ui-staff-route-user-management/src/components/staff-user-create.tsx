import { Button, Form, Input, Select, Space, Typography } from 'antd';
import type React from 'react';

const { Title } = Typography;

export interface StaffUserCreateFormValues {
	displayName: string;
	email: string;
	roleId?: string;
}

export interface StaffUserCreateProps {
	availableRoles: { id: string; roleName: string }[];
	onSubmit: (values: StaffUserCreateFormValues) => void;
	onCancel: () => void;
	loading?: boolean;
}

export const StaffUserCreate: React.FC<StaffUserCreateProps> = ({ availableRoles, onSubmit, onCancel, loading }) => {
	const [form] = Form.useForm<StaffUserCreateFormValues>();

	return (
		<Space
			direction="vertical"
			size="large"
			style={{ width: '100%', maxWidth: 600 }}
		>
			<Title level={4}>Create Staff User</Title>
			<Form
				form={form}
				layout="vertical"
				initialValues={{ displayName: '', email: '', roleId: undefined }}
				onFinish={onSubmit}
			>
				<Form.Item
					name="displayName"
					label="Display Name"
					rules={[{ required: true, message: 'Display name is required' }]}
				>
					<Input placeholder="e.g. Alice Admin" />
				</Form.Item>
				<Form.Item
					name="email"
					label="Email"
					rules={[
						{ required: true, message: 'Email is required' },
						{ type: 'email', message: 'Please enter a valid email' },
					]}
				>
					<Input placeholder="e.g. alice@example.com" />
				</Form.Item>
				<Form.Item
					name="roleId"
					label="Assigned Role"
				>
					<Select
						placeholder="Select a role"
						allowClear
						options={availableRoles.map((role) => ({ value: role.id, label: role.roleName }))}
					/>
				</Form.Item>
				<Form.Item>
					<Space>
						<Button
							type="primary"
							htmlType="submit"
							loading={!!loading}
						>
							Create Staff User
						</Button>
						<Button onClick={onCancel}>Cancel</Button>
					</Space>
				</Form.Item>
			</Form>
		</Space>
	);
};
