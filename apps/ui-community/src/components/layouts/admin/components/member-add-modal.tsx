import { Button, Form, Input, Modal } from 'antd';

interface MemberAddFormValues {
	memberName: string;
	firstName: string;
	lastName?: string;
	userExternalId: string;
}

export const MemberAddModal: React.FC<{ open: boolean; loading?: boolean; onAdd: (values: MemberAddFormValues) => void; onCancel: () => void }> = ({ open, loading, onAdd, onCancel }) => {
	const [form] = Form.useForm<MemberAddFormValues>();

	const handleOk = () => {
		form.validateFields().then((values) => {
			onAdd(values);
			form.resetFields();
		});
	};

	const handleCancel = () => {
		form.resetFields();
		onCancel();
	};

	return (
		<Modal
			title="Add Member"
			open={open}
			onCancel={handleCancel}
			footer={[
				<Button
					key="cancel"
					onClick={handleCancel}
				>
					Cancel
				</Button>,
				<Button
					key="submit"
					type="primary"
					loading={loading}
					onClick={handleOk}
				>
					Add Member
				</Button>,
			]}
		>
			<Form
				form={form}
				layout="vertical"
				name="member-add-form"
			>
				<Form.Item
					name="memberName"
					label="Member Name"
					rules={[{ required: true, message: 'Please enter a member name' }]}
				>
					<Input placeholder="e.g. John Doe" />
				</Form.Item>
				<Form.Item
					name="firstName"
					label="First Name"
					rules={[{ required: true, message: 'Please enter first name' }]}
				>
					<Input placeholder="First name" />
				</Form.Item>
				<Form.Item
					name="lastName"
					label="Last Name"
				>
					<Input placeholder="Last name (optional)" />
				</Form.Item>
				<Form.Item
					name="userExternalId"
					label="User External ID"
					rules={[{ required: true, message: 'Please enter the user external ID' }]}
				>
					<Input placeholder="e.g. auth0|123456" />
				</Form.Item>
			</Form>
		</Modal>
	);
};
