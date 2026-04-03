import { Button, Descriptions, Form, Input } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import type { AdminMembersDetailContainerMemberFieldsFragment, MemberUpdateInput } from '../../../../generated.tsx';

export interface MembersDetailProps {
	data: AdminMembersDetailContainerMemberFieldsFragment;
	onSave: (values: MemberUpdateInput) => Promise<void>;
	loading?: boolean;
}

export const MembersDetail: React.FC<MembersDetailProps> = (props) => {
	const [form] = Form.useForm<MemberUpdateInput>();
	const data = props.data;

	return (
		<>
			<Descriptions
				title="Member Info"
				size="small"
				layout="vertical"
			>
				<Descriptions.Item label="Id">{data.id}</Descriptions.Item>
				<Descriptions.Item label="Created At">{data.createdAt ? dayjs(data.createdAt as string).format('MM/DD/YYYY') : '—'}</Descriptions.Item>
				<Descriptions.Item label="Updated At">{data.updatedAt ? dayjs(data.updatedAt as string).format('MM/DD/YYYY') : '—'}</Descriptions.Item>
			</Descriptions>
			<Form
				layout="vertical"
				form={form}
				initialValues={data}
				onFinish={(values) => {
					props.onSave(values);
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
					Save
				</Button>
			</Form>
		</>
	);
};
