import { Button, Form, Input } from 'antd';
import type { MemberCreateInput } from '../generated.tsx';
import type React from 'react';

interface MembersCreateProps {
        data: {
        communityId: string;
    }
	onSave: (member: MemberCreateInput) => void;
}

export const MembersCreate: React.FC<MembersCreateProps> = (props) => {
	const [form] = Form.useForm<MemberCreateInput>();

	return (
		<div>
			<Form
				layout="vertical"
				form={form}
				initialValues={{ memberName: '' }}
				onFinish={(values) => {
					props.onSave({
                        ...values,
                        communityId: props.data.communityId,
                    });
				}}
			>
				<Form.Item
					name={['memberName']}
					label="Member Name"
					rules={[{ required: true, message: 'Member name is required.' }]}
				>
					<Input
						placeholder="Member Name"
						maxLength={200}
					/>
				</Form.Item>

				<Button
					type="primary"
					htmlType="submit"
				>
					Create Member
				</Button>
			</Form>
		</div>
	);
};
