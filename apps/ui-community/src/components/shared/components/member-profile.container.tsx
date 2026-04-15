import { gql, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { MemberProfile, type MemberProfileData } from './member-profile.tsx';

interface MemberProfileContainerProps {
	data: {
		communityId: string;
		id: string;
	};
	isAdmin?: boolean;
}

interface MemberProfileContainerQuery {
	membersByCommunityId: MemberProfileData[];
}

interface MemberProfileContainerQueryVariables {
	communityId: string;
}

const MemberProfileContainerMembersDocument = gql`
	query MemberProfileContainerMembers($communityId: ObjectID!) {
		membersByCommunityId(communityId: $communityId) {
			id
			memberName
			profile {
				name
				email
				bio
				showInterests
				showEmail
				showProfile
				showLocation
				showProperties
			}
			createdAt
			updatedAt
		}
	}
`;

export const MemberProfileContainer: React.FC<MemberProfileContainerProps> = (props) => {
	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery<MemberProfileContainerQuery, MemberProfileContainerQueryVariables>(MemberProfileContainerMembersDocument, {
		variables: { communityId: props.data.communityId },
	});

	const selectedMember = memberData?.membersByCommunityId?.find((member: MemberProfileData) => member.id === props.data.id) || null;

	const memberProfileProps = {
		data: selectedMember,
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
