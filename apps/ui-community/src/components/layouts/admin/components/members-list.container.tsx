import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import {
	type AdminMembersListContainerMemberFieldsFragment,
	AdminMembersListContainerMembersByCommunityIdDocument,
} from '../../../../generated.tsx';
import type { MembersListProps } from './members-list.tsx';
import { MembersList } from './members-list.tsx';

export interface MembersListContainerProps {
	data: {
		communityId: string;
	};
}

export const MembersListContainer: React.FC<MembersListContainerProps> = (
	props,
) => {
	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery(AdminMembersListContainerMembersByCommunityIdDocument, {
		variables: { communityId: props.data.communityId },
	});

	const membersListProps: MembersListProps = {
		data: (memberData?.membersByCommunityId ??
			[]) as AdminMembersListContainerMemberFieldsFragment[],
	};

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={memberData?.membersByCommunityId}
			hasDataComponent={<MembersList {...membersListProps} />}
			error={memberError}
		/>
	);
};
