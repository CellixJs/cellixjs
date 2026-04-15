import { useMutation } from '@apollo/client';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { MemberCreateAccountInput } from '../../../../generated.tsx';
import { AdminMembersAccountsAddContainerMemberCreateAccountDocument } from '../../../../generated.tsx';
import { MembersAccountsAdd } from './members-accounts-add.tsx';

interface MembersAccountsAddContainerProps {
	data: {
		id: string;
	};
}

export const MembersAccountsAddContainer: React.FC<MembersAccountsAddContainerProps> = (props) => {
	const navigate = useNavigate();
	const { message } = App.useApp();
	const [memberCreateAccount] = useMutation(AdminMembersAccountsAddContainerMemberCreateAccountDocument);

	const defaultValues: MemberCreateAccountInput = {
		memberId: props.data.id,
		firstName: '',
		lastName: '',
	};

	const handleSave = async (values: MemberCreateAccountInput) => {
		try {
			const result = await memberCreateAccount({
				variables: {
					input: values,
				},
			});
			if (result.data?.memberCreateAccount.status.success) {
				message.success('Member Account Added');
				navigate('../');
			} else {
				message.error(`Error Adding Member Account: ${result.data?.memberCreateAccount.status.errorMessage}`);
			}
		} catch (error) {
			message.error(`Error Adding Member Account: ${JSON.stringify(error)}`);
		}
	};

	return (
		<MembersAccountsAdd
			onSave={handleSave}
			data={defaultValues}
		/>
	);
};
