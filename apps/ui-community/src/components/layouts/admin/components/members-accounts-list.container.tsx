import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { App } from 'antd';
import { useParams } from 'react-router-dom';
import { AdminMembersAccountsListContainerMemberAccountRemoveDocument, AdminMembersAccountsListContainerMemberDocument, type AdminMembersAccountsListContainerMemberFieldsFragment } from '../../../../generated.tsx';
import { MembersAccountsList, type MembersAccountsListProps } from './members-accounts-list.tsx';

export const MembersAccountsListContainer: React.FC = () => {
	const { message } = App.useApp();
	const params = useParams();
	// biome-ignore lint:useLiteralKeys
	const memberId = params['memberId'] ?? '';

	const { data, loading, error } = useQuery(AdminMembersAccountsListContainerMemberDocument, {
		variables: { id: memberId },
		skip: !memberId,
	});

	const [removeAccount, { loading: removeLoading, error: removeError }] = useMutation(AdminMembersAccountsListContainerMemberAccountRemoveDocument);

	const handleRemove = async (accountId: string) => {
		try {
			const result = await removeAccount({
				variables: {
					input: {
						memberId,
						accountId,
					},
				},
			});
			if (result.data?.memberAccountRemove?.status?.success) {
				message.success('Account removed');
			} else {
				message.error(result.data?.memberAccountRemove?.status?.errorMessage ?? 'Unknown error');
			}
		} catch (removeErr) {
			message.error(`Error removing account: ${removeErr instanceof Error ? removeErr.message : JSON.stringify(removeErr)}`);
		}
	};

	const listProps: MembersAccountsListProps = {
		data: data?.member as AdminMembersAccountsListContainerMemberFieldsFragment,
		onRemove: handleRemove,
		removeLoading,
	};

	return (
		<ComponentQueryLoader
			loading={loading}
			hasData={data?.member}
			hasDataComponent={<MembersAccountsList {...listProps} />}
			error={error ?? removeError}
		/>
	);
};
