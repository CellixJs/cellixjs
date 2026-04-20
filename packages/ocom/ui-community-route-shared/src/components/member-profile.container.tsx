import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type React from 'react';
import { useParams } from 'react-router-dom';
import {
	MemberProfileContainerMemberProfileDocument,
	type MemberProfileContainerMemberFieldsFragment,
	type MemberProfileContainerMemberProfileQuery,
	type MemberProfileContainerMemberProfileQueryVariables,
} from '../generated.tsx';
import { MemberProfile } from './member-profile.js';

export interface MemberProfileContainerProps {
	communityId: string;
	isAdmin?: boolean;
}

export const MemberProfileContainer: React.FC<MemberProfileContainerProps> = (props) => {
	const { id, memberId } = useParams<{ id?: string; memberId?: string }>();
	const memberObjectId = id ?? memberId;

	const { data: memberData, loading: memberLoading, error: memberError } = useQuery<
		MemberProfileContainerMemberProfileQuery,
		MemberProfileContainerMemberProfileQueryVariables
	>(MemberProfileContainerMemberProfileDocument, {
		variables: {
			id: memberObjectId ?? '',
		},
		skip: !memberObjectId,
	});

	const memberProfileProps = {
		data: memberData?.member as MemberProfileContainerMemberFieldsFragment,
		isAdmin: props.isAdmin ?? false,
	};

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={memberData?.member}
			hasDataComponent={<MemberProfile {...memberProfileProps} />}
			error={memberError}
		/>
	);
};
