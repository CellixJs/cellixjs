import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { AdminMemberListContainerMembersDocument, type AdminMemberListContainerMembersQuery, type AdminMemberListContainerMembersQueryVariables, type MemberProfileContainerMemberFieldsFragment } from '../../../generated.tsx';
import { MemberProfile } from './member-profile.tsx';

interface MemberProfileContainerProps {
	data: {
		communityId: string;
		id: string;
	};
	isAdmin?: boolean;
}

export const MemberProfileContainer: React.FC<MemberProfileContainerProps> = (props) => {
	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery<AdminMemberListContainerMembersQuery, AdminMemberListContainerMembersQueryVariables>(AdminMemberListContainerMembersDocument, {
		variables: { communityId: props.data.communityId },
	});

	const selectedMember = memberData?.membersByCommunityId?.find((m) => m.id === props.data.id) || null;

	const memberProfileProps = {
		data: selectedMember as MemberProfileContainerMemberFieldsFragment | null,
		isAdmin: props.isAdmin || false,
	};

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={selectedMember}
			hasDataComponent={<MemberProfile {...memberProfileProps} />}
			error={memberError}
			noDataComponent={<div>No member profile found</div>}
		/>
	);
};
