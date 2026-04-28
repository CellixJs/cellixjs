import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
	AdminMembersAccountsAddContainerEndUsersByCommunityDocument,
	AdminMembersAccountsAddContainerMemberCreateAccountDocument,
	AdminMembersAccountsListContainerMemberDocument,
	type AdminMembersAccountsAddContainerEndUserFieldsFragment,
    type MemberCreateAccountInput
} from '../generated.tsx';
import { MembersAccountsAdd, type MembersAccountsAddProps } from './members-accounts-add.tsx';
import type React from 'react';

interface MembersAccountsAddContainerProps {
	data: {
		id: string;
		communityId: string;
	};
}

export const MembersAccountsAddContainer: React.FC<MembersAccountsAddContainerProps> = (props) => {
	const navigate = useNavigate();
	const { message } = App.useApp();
	const [memberCreateAccount, { loading: memberCreateAccountLoading }] = useMutation(AdminMembersAccountsAddContainerMemberCreateAccountDocument, {
		refetchQueries: [
			{
				query: AdminMembersAccountsListContainerMemberDocument,
				variables: { id: props.data.id },
			},
		],
		awaitRefetchQueries: true,
	});
	const { data: endUsersData, loading: endUsersLoading, error: endUsersError } = useQuery(AdminMembersAccountsAddContainerEndUsersByCommunityDocument, {
		variables: {
			communityId: props.data.communityId,
		},
	});

	const defaultValues: MemberCreateAccountInput = {
		memberId: props.data.id,
		endUserId: '',
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

	const membersAccountsAddProps: MembersAccountsAddProps = {
		onSave: handleSave,
		data: defaultValues,
		endUsers: (endUsersData?.endUsersByCommunityId as AdminMembersAccountsAddContainerEndUserFieldsFragment[]) || [],
		loading: memberCreateAccountLoading,
	};

	return (
		<ComponentQueryLoader
			loading={endUsersLoading}
			hasData={endUsersData?.endUsersByCommunityId}
			hasDataComponent={<MembersAccountsAdd {...membersAccountsAddProps} />}
			error={endUsersError}
		/>
	);
};
