import { Button, Form, Input } from 'antd';
import React from 'react';
import type { MemberCreateAccountInput } from '../../../../generated.tsx';

interface MembersAccountsAddProps {
	data: MemberCreateAccountInput;
	onSave: (member: MemberCreateAccountInput) => Promise<void>;
}

export const MembersAccountsAdd: React.FC<MembersAccountsAddProps> = (props) => {
	const [form] = Form.useForm<MemberCreateAccountInput>();
	const [formLoading, setFormLoading] = React.useState<boolean>(false);

	const handleFinish = async (values: MemberCreateAccountInput) => {
		setFormLoading(true);
		try {
			// Ensure memberId is preserved from props
			values.memberId = props.data.memberId;
			await props.onSave(values);
		} catch (error) {
			console.error('Failed to add Member Account:', error);
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
					Add Member Account
				</Button>
			</Form>
		</div>
	);
};
