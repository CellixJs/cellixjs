import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type React from 'react';
import { AdminMembersDetailContainerMemberDocument, type AdminMembersDetailContainerMemberFieldsFragment, type AdminMembersDetailContainerMemberQuery, type AdminMembersDetailContainerMemberQueryVariables } from '../generated.tsx';
import { MembersDetail } from './members-detail.tsx';

interface MembersDetailContainerProps {
	data: {
		id: string;
	};
}

export const MembersDetailContainer: React.FC<MembersDetailContainerProps> = (props) => {
	const { data, loading, error } = useQuery<AdminMembersDetailContainerMemberQuery, AdminMembersDetailContainerMemberQueryVariables>(AdminMembersDetailContainerMemberDocument, {
		variables: {
			id: props.data.id,
		},
		skip: !props.data.id,
	});

	return (
		<ComponentQueryLoader
			loading={loading}
			hasData={data?.member}
			hasDataComponent={<MembersDetail data={{ member: data?.member as AdminMembersDetailContainerMemberFieldsFragment }} />}
			error={error}
		/>
	);
};
