import type React from 'react';
import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { MembersDetail } from './members-detail.tsx';
import {
	AdminMembersDetailContainerMembersByCommunityDocument,
	type AdminMembersDetailContainerMemberFieldsFragment,
	type AdminMembersDetailContainerMembersByCommunityQuery,
	type AdminMembersDetailContainerMembersByCommunityQueryVariables,
} from '../../../../generated.tsx';

export interface MembersDetailContainerProps {
	data: {
		id: string;
		communityId: string;
	};
}

export const MembersDetailContainer: React.FC<MembersDetailContainerProps> = (props) => {
	const { data, loading, error } = useQuery<AdminMembersDetailContainerMembersByCommunityQuery, AdminMembersDetailContainerMembersByCommunityQueryVariables>(AdminMembersDetailContainerMembersByCommunityDocument, {
		variables: {
			communityId: props.data.communityId,
		},
	});

	// Find the specific member by ID
	const selectedMember = data?.membersByCommunityId?.find((member) => member.id === props.data.id);

	return (
		<ComponentQueryLoader
			loading={loading}
			hasData={selectedMember}
			hasDataComponent={<MembersDetail data={{ member: selectedMember as AdminMembersDetailContainerMemberFieldsFragment }} />}
			error={error}
		/>
	);
};
