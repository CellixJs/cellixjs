import { Button, Form, Input } from 'antd';
import type { MemberCreateInput } from '../../../../generated.tsx';

export interface MembersCreateProps {
	data: MemberCreateInput;
	onSave: (member: MemberCreateInput) => void;
	loading?: boolean;
}

export const MembersCreate: React.FC<MembersCreateProps> = (props) => {
	const [form] = Form.useForm<MemberCreateInput>();

	return (
		<div>
			<Form
				layout="vertical"
				form={form}
				initialValues={props.data}
				onFinish={(values) => {
					props.onSave(values);
				}}
			>
				<Form.Item
					name={['memberName']}
					label="Member Name"
					rules={[{ required: true, message: 'Member name is required.' }]}
				>
					<Input placeholder="Member Name" maxLength={200} />
				</Form.Item>

				<Button
					type="primary"
					htmlType="submit"
					value={'save'}
					loading={props.loading}
				>
					Create Member
				</Button>
			</Form>
		</div>
	);
};
