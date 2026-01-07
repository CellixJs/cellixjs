import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import {
	type AdminMembersAccountsListContainerMemberAccountFieldsFragment,
	AdminMembersAccountsListContainerMemberDocument,
} from '../../../../generated.tsx';
import { MembersAccountsList } from './members-accounts-list.tsx';

export interface MembersAccountsListContainerProps {
	data: {
		id: string;
	};
}

export const MembersAccountsListContainer: React.FC<
	MembersAccountsListContainerProps
> = (props) => {
	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery(AdminMembersAccountsListContainerMemberDocument, {
		variables: {
			id: props.data.id,
		},
	});

	const membersAccountsListProps = {
		data: (memberData?.member?.accounts ??
			[]) as AdminMembersAccountsListContainerMemberAccountFieldsFragment[],
	};

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={memberData?.member}
			hasDataComponent={<MembersAccountsList {...membersAccountsListProps} />}
			error={memberError}
		/>
	);
};
