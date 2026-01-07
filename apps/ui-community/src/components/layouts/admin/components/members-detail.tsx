import { Button, Descriptions, Form, Input } from 'antd';
import dayjs from 'dayjs';
import type {
	AdminMembersDetailContainerMemberFieldsFragment,
	MemberUpdateInput,
} from '../../../../generated.tsx';

export interface MembersDetailProps {
	data: {
		member: AdminMembersDetailContainerMemberFieldsFragment;
	};
	onSave: (member: MemberUpdateInput) => void;
	loading?: boolean;
}

export const MembersDetail: React.FC<MembersDetailProps> = (props) => {
	const [form] = Form.useForm<MemberUpdateInput>();

	return (
		<div>
			<Descriptions title="Member Info" size={'small'} layout={'vertical'}>
				<Descriptions.Item label="Id">{props.data.member.id}</Descriptions.Item>
				<Descriptions.Item label="Created At">
					{dayjs(props.data.member.createdAt).format('MM/DD/YYYY')}
				</Descriptions.Item>
				<Descriptions.Item label="Updated At">
					{dayjs(props.data.member.updatedAt).format('MM/DD/YYYY')}
				</Descriptions.Item>
			</Descriptions>
			<Form
				layout="vertical"
				form={form}
				initialValues={props.data.member}
				onFinish={(values) => {
					props.onSave({
						...values,
						id: props.data.member.id,
					});
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
					Save
				</Button>
			</Form>
		</div>
	);
};
