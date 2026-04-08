import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { useNavigate, useParams } from 'react-router-dom';
import { App } from 'antd';
import type { MemberUpdateAccountInput } from '../../../../generated.tsx';
import { AdminMembersAccountsEditContainerMemberDocument, AdminMembersAccountsEditContainerMemberUpdateAccountDocument, AdminMembersAccountsEditContainerMemberRemoveAccountDocument } from '../../../../generated.tsx';
import { MembersAccountsEdit } from './members-accounts-edit.tsx';

export interface MembersAccountsEditContainerProps {
	data: {
		memberId: string;
	};
}

export const MembersAccountsEditContainer: React.FC<MembersAccountsEditContainerProps> = (props) => {
	const params = useParams<{ accountId: string }>();
	const navigate = useNavigate();
	const { message } = App.useApp();

	const [memberUpdateAccount] = useMutation(AdminMembersAccountsEditContainerMemberUpdateAccountDocument);
	const [memberRemoveAccount] = useMutation(AdminMembersAccountsEditContainerMemberRemoveAccountDocument);

	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery(AdminMembersAccountsEditContainerMemberDocument, {
		variables: {
			id: props.data.memberId,
		},
	});

	const handleRemove = async () => {
		try {
			const result = await memberRemoveAccount({
				variables: {
					input: {
						memberId: props.data.memberId,
						accountId: params.accountId || '',
					},
				},
			});
			if (result.data?.memberRemoveAccount.status.success) {
				message.success('Member Account Removed');
				navigate('../');
			} else {
				message.error(`Error Removing Member Account: ${result.data?.memberRemoveAccount.status.errorMessage}`);
			}
		} catch (error) {
			message.error(`Error Removing Member Account: ${JSON.stringify(error)}`);
		}
	};

	const handleSave = async (values: MemberUpdateAccountInput) => {
		try {
			values.memberId = props.data.memberId;
			values.accountId = params.accountId || '';
			const result = await memberUpdateAccount({
				variables: {
					input: values,
				},
			});
			if (result.data?.memberUpdateAccount.status.success) {
				message.success('Member Account Updated');
				navigate('../');
			} else {
				message.error(`Error Updating Member Account: ${result.data?.memberUpdateAccount.status.errorMessage}`);
			}
		} catch (error) {
			message.error(`Error Updating Member Account: ${JSON.stringify(error)}`);
		}
	};

	const accountToEdit = memberData?.member?.accounts?.find((x) => x?.id === params.accountId);

	if (accountToEdit) {
		const defaultValues: MemberUpdateAccountInput = {
			memberId: props.data.memberId,
			accountId: params.accountId || '',
			firstName: accountToEdit.firstName || '',
			lastName: accountToEdit.lastName || '',
		};

		const membersAccountsEditProps = {
			data: defaultValues,
			onSave: handleSave,
			onRemove: handleRemove,
		};

		return (
			<ComponentQueryLoader
				loading={memberLoading}
				hasData={memberData?.member}
				hasDataComponent={<MembersAccountsEdit {...membersAccountsEditProps} />}
				error={memberError}
				noDataComponent={<div>Account not found for {params.accountId}</div>}
			/>
		);
	}

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={memberData?.member}
			hasDataComponent={<div>Account not found for {params.accountId}</div>}
			error={memberError}
			noDataComponent={<div>No Data...</div>}
		/>
	);
};
