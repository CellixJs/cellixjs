import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { useParams } from 'react-router-dom';
import { type AdminMemberListContainerMemberFieldsFragment, AdminMemberListContainerMembersByCommunityIdDocument } from '../../../../generated.tsx';
import { MemberList, type MemberListProps } from './member-list.tsx';

export const MemberListContainer: React.FC = () => {
	const params = useParams();

	const {
		data: membersData,
		loading: membersLoading,
		error: membersError,
	} = useQuery(AdminMemberListContainerMembersByCommunityIdDocument, {
		// biome-ignore lint:useLiteralKeys
		variables: { communityId: params['communityId'] ?? '' },
	});

	const memberListProps: MemberListProps = {
		data: (membersData?.membersByCommunityId ?? []) as AdminMemberListContainerMemberFieldsFragment[],
	};

	return (
		<ComponentQueryLoader
			loading={membersLoading}
			hasData={membersData}
			hasDataComponent={<MemberList {...memberListProps} />}
			error={membersError}
		/>
	);
};
