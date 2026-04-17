import { gql, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type React from 'react';
import { MemberProfileView, type MemberProfileData } from './member-profile-view.tsx';

export interface MemberProfileContainerProps {
	data: {
		id: string;
		communityId: string;
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

	const selectedMember = memberData?.membersByCommunityId?.find((member) => member.id === props.data.id) ?? null;

	const memberProfileProps = { data: selectedMember, isAdmin: props.isAdmin ?? false };

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={selectedMember}
			hasDataComponent={<MemberProfileView {...memberProfileProps} />}
			error={memberError}
			noDataComponent={<div>No member profile found</div>}
		/>
	);
};
