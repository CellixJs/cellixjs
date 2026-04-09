import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { Button } from 'antd';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminMemberListContainerMembersByCommunityIdDocument, type AdminMemberListContainerMemberFieldsFragment } from '../../../../generated.tsx';
import { MemberList, type MemberListProps } from './member-list.tsx';

export const MemberListContainer: React.FC = () => {
	const params = useParams();
	// biome-ignore lint:useLiteralKeys
	const communityId = params['communityId'] ?? '';
	const [searchValue, setSearchValue] = useState('');
	const navigate = useNavigate();

	const { data, loading, error } = useQuery(AdminMemberListContainerMembersByCommunityIdDocument, {
		variables: { communityId },
		skip: !communityId,
	});

	const memberListProps: MemberListProps = {
		data: (data?.membersByCommunityId ?? []) as AdminMemberListContainerMemberFieldsFragment[],
		searchValue,
		onSearchChange: setSearchValue,
		communityId,
	};

	return (
		<div>
			<div className="flex justify-end mb-4">
				<Button
					type="primary"
					onClick={() => navigate('create')}
				>
					Create Member
				</Button>
			</div>
			<ComponentQueryLoader
				loading={loading}
				hasData={data?.membersByCommunityId}
				hasDataComponent={<MemberList {...memberListProps} />}
				error={error}
			/>
		</div>
	);
};
