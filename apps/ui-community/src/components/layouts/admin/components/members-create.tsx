import { Button, Form, Input } from 'antd';
import type React from 'react';
import type { MemberCreateInput } from '../../../../generated.tsx';

export interface MembersCreateProps {
	communityId: string;
	onSave: (values: MemberCreateInput) => Promise<void>;
	loading?: boolean;
}

export const MembersCreate: React.FC<MembersCreateProps> = (props) => {
	const [form] = Form.useForm<MemberCreateInput>();

	return (
		<Form
			layout="vertical"
			form={form}
			initialValues={{ communityId: props.communityId }}
			onFinish={(values) => {
				props.onSave({ ...values, communityId: props.communityId });
			}}
		>
			<Form.Item
				name="memberName"
				label="Member Name"
				rules={[{ required: true, message: 'Member Name is required.' }]}
			>
				<Input
					placeholder="Name"
					maxLength={200}
				/>
			</Form.Item>
			<Button
				type="primary"
				htmlType="submit"
				value="save"
				loading={props.loading}
			>
				Create Member
			</Button>
		</Form>
	);
};
