import React from 'react';
import { UserDeleteOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import type { MemberUpdateAccountInput } from '../../../../generated.tsx';

interface MembersAccountsEditProps {
	data: MemberUpdateAccountInput;
	onSave: (member: MemberUpdateAccountInput) => Promise<void>;
	onRemove: () => Promise<void>;
}

export const MembersAccountsEdit: React.FC<MembersAccountsEditProps> = (props) => {
	const [form] = Form.useForm<MemberUpdateAccountInput>();
	const [formLoading, setFormLoading] = React.useState<boolean>(false);

	const handleFinish = async (values: MemberUpdateAccountInput) => {
		setFormLoading(true);
		try {
			await props.onSave(values);
		} catch (error) {
			console.error('Failed to save Member Account:', error);
		} finally {
			setFormLoading(false);
		}
	};

	const handleRemove = async () => {
		setFormLoading(true);
		try {
			await props.onRemove();
		} catch (error) {
			console.error('Failed to remove Member Account:', error);
		} finally {
			setFormLoading(false);
		}
	};

	return (
		<div>
			<Form
				layout="vertical"
				form={form}
				initialValues={props.data}
				onFinish={handleFinish}
			>
				<Form.Item
					name="firstName"
					label="First Name"
					rules={[{ required: true, message: 'First name is required.' }]}
				>
					<Input
						placeholder="First Name"
						maxLength={200}
					/>
				</Form.Item>
				<Form.Item
					name="lastName"
					label="Last Name"
				>
					<Input
						placeholder="Last Name"
						maxLength={200}
					/>
				</Form.Item>

				<Button
					type="primary"
					htmlType="submit"
					loading={formLoading}
				>
					Save Member Account
				</Button>

				<Button
					type="primary"
					danger
					icon={<UserDeleteOutlined />}
					onClick={handleRemove}
					className="float-right"
					loading={formLoading}
				>
					Remove Member Account
				</Button>
			</Form>
		</div>
	);
};
