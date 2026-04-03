import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
	AdminMemberListContainerMembersByCommunityIdDocument,
	type AdminMemberListContainerMemberFieldsFragment,
} from '../../../../generated.tsx';
import { MemberList, type MemberListProps } from './member-list.tsx';

export const MemberListContainer: React.FC = () => {
	const params = useParams();
	// biome-ignore lint:useLiteralKeys
	const communityId = params['communityId'] ?? '';
	const [searchValue, setSearchValue] = useState('');

	const { data, loading, error } = useQuery(AdminMemberListContainerMembersByCommunityIdDocument, {
		variables: { communityId },
		skip: !communityId,
	});

	const memberListProps: MemberListProps = {
		data: (data?.membersByCommunityId ?? []) as AdminMemberListContainerMemberFieldsFragment[],
		searchValue,
		onSearchChange: setSearchValue,
	};

	return (
		<ComponentQueryLoader
			loading={loading}
			hasData={data?.membersByCommunityId}
			hasDataComponent={<MemberList {...memberListProps} />}
			error={error}
		/>
	);
};
