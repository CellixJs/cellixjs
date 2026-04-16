import { Button, Form, Select } from 'antd';
import type { AdminMembersAccountsAddContainerEndUserFieldsFragment, MemberCreateAccountInput } from '../generated.tsx';

export interface MembersAccountsAddProps {
	data: MemberCreateAccountInput;
	onSave: (member: MemberCreateAccountInput) => Promise<void>;
	endUsers: AdminMembersAccountsAddContainerEndUserFieldsFragment[];
	loading: boolean;
}

export const MembersAccountsAdd: React.FC<MembersAccountsAddProps> = (props) => {
	const [form] = Form.useForm<MemberCreateAccountInput>();
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
				onFinish={(values) => props.onSave({ ...values, memberId: props.data.memberId })}
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
					Add Member Account
				</Button>
			</Form>
		</div>
	);
};
