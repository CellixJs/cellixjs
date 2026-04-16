import { UserDeleteOutlined } from '@ant-design/icons';
import { Button, Form, Select } from 'antd';
import type { AdminMembersAccountsEditContainerEndUserFieldsFragment, MemberUpdateAccountInput } from '../generated.tsx';

export interface MembersAccountsEditProps {
	data: MemberUpdateAccountInput;
	onSave: (member: MemberUpdateAccountInput) => Promise<void>;
	onRemove: () => Promise<void>;
	endUsers: AdminMembersAccountsEditContainerEndUserFieldsFragment[];
	loading: boolean;
}

export const MembersAccountsEdit: React.FC<MembersAccountsEditProps> = (props) => {
	const [form] = Form.useForm<MemberUpdateAccountInput>();
	const endUserOptions = props.endUsers.map((endUser) => ({
		value: endUser.id,
		label: endUser.displayName || endUser.personalInformation?.contactInformation?.email || endUser.id,
	}));

	return (
		<div>
			<Form
				layout="vertical"
				form={form}
				initialValues={props.data}
				onFinish={(values) => props.onSave(values)}
			>
				<Form.Item
					name="endUserId"
					label="End User"
					rules={[{ required: true, message: 'An end user is required.' }]}
				>
					<Select
						placeholder="Select end user"
						options={endUserOptions}
						showSearch
						optionFilterProp="label"
						allowClear
					/>
				</Form.Item>

				<Button
					type="primary"
					htmlType="submit"
					loading={props.loading}
					disabled={props.endUsers.length === 0}
				>
					Save Member Account
				</Button>

				<Button
					type="primary"
					danger
					icon={<UserDeleteOutlined />}
					onClick={props.onRemove}
					className="float-right"
					loading={props.loading}
				>
					Remove Member Account
				</Button>
			</Form>
		</div>
	);
};
