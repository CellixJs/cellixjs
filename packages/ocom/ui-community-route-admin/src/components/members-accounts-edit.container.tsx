import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { App } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import type { MemberUpdateAccountInput } from '../generated.tsx';
import {
	AdminMembersAccountsEditContainerEndUsersByCommunityDocument,
	AdminMembersAccountsEditContainerMemberDocument,
	AdminMembersAccountsEditContainerMemberRemoveAccountDocument,
	AdminMembersAccountsEditContainerMemberUpdateAccountDocument,
	AdminMembersAccountsListContainerMemberDocument,
	type AdminMembersAccountsEditContainerEndUserFieldsFragment,
} from '../generated.tsx';
import { MembersAccountsEdit, type MembersAccountsEditProps } from './members-accounts-edit.tsx';

interface MembersAccountsEditContainerProps {
	data: {
		memberId: string;
		communityId: string;
	};
}

export const MembersAccountsEditContainer: React.FC<MembersAccountsEditContainerProps> = (props) => {
	const params = useParams<{ accountId: string }>();
	const navigate = useNavigate();
	const { message } = App.useApp();

	const [memberUpdateAccount, { loading: memberUpdateAccountLoading }] = useMutation(AdminMembersAccountsEditContainerMemberUpdateAccountDocument, {
		refetchQueries: [
			{
				query: AdminMembersAccountsListContainerMemberDocument,
				variables: { id: props.data.memberId },
			},
			{
				query: AdminMembersAccountsEditContainerMemberDocument,
				variables: { id: props.data.memberId },
			},
		],
		awaitRefetchQueries: true,
	});
	const [memberRemoveAccount, { loading: memberRemoveAccountLoading }] = useMutation(AdminMembersAccountsEditContainerMemberRemoveAccountDocument, {
		refetchQueries: [
			{
				query: AdminMembersAccountsListContainerMemberDocument,
				variables: { id: props.data.memberId },
			},
			{
				query: AdminMembersAccountsEditContainerMemberDocument,
				variables: { id: props.data.memberId },
			},
		],
		awaitRefetchQueries: true,
	});

	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery(AdminMembersAccountsEditContainerMemberDocument, {
		variables: {
			id: props.data.memberId,
		},
	});
	const {
		data: endUsersData,
		loading: endUsersLoading,
		error: endUsersError,
	} = useQuery(AdminMembersAccountsEditContainerEndUsersByCommunityDocument, {
		variables: {
			communityId: props.data.communityId,
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
			console.error('Error Removing Member Account', error);
			const errorMessage = error instanceof Error ? error.message : String(error);
			message.error(`Error Removing Member Account: ${errorMessage}`);
		}
	};

	const handleSave = async (values: MemberUpdateAccountInput) => {
		try {
			const result = await memberUpdateAccount({
				variables: {
					input: {
						...values,
						memberId: props.data.memberId,
						accountId: params.accountId || '',
					},
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

	const accountToEdit = memberData?.member?.accounts?.find((account) => account.id === params.accountId);

	if (accountToEdit) {
		const defaultValues: MemberUpdateAccountInput = {
			memberId: props.data.memberId,
			accountId: params.accountId || '',
			endUserId: accountToEdit.user?.id || '',
		};

		const membersAccountsEditProps: MembersAccountsEditProps = {
			data: defaultValues,
			onSave: handleSave,
			onRemove: handleRemove,
			endUsers: (endUsersData?.endUsersByCommunityId as AdminMembersAccountsEditContainerEndUserFieldsFragment[]) || [],
			loading: memberUpdateAccountLoading || memberRemoveAccountLoading,
		};

		return (
			<ComponentQueryLoader
				loading={memberLoading || endUsersLoading}
				hasData={memberData?.member}
				hasDataComponent={<MembersAccountsEdit {...membersAccountsEditProps} />}
				error={memberError || endUsersError}
				noDataComponent={<div>Account not found for {params.accountId}</div>}
			/>
		);
	}

	return (
		<ComponentQueryLoader
			loading={memberLoading || endUsersLoading}
			hasData={memberData?.member}
			hasDataComponent={<div>Account not found for {params.accountId}</div>}
			error={memberError || endUsersError}
			noDataComponent={<div>No Data...</div>}
		/>
	);
};
