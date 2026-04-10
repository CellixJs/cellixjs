import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type { AdminCommunityDetailContainerCommunityFieldsFragment } from '../../../../../../apps/ui-community/src/generated.js';
import { AdminCommunityDetailContainerCommunityByIdDocument } from '../../../../../../apps/ui-community/src/generated.js';
import { CommunityDetail, type CommunityDetailProps } from './community-detail.js';

export interface CommunityDetailContainerProps {
	data: { id?: string };
}

export const CommunityDetailContainer: React.FC<CommunityDetailContainerProps> = (props) => {
	const {
		data: communityData,
		loading: communityLoading,
		error: communityError,
	} = useQuery(AdminCommunityDetailContainerCommunityByIdDocument, {
		variables: { id: props.data.id ?? '' },
	});

	const communityDetailProps: CommunityDetailProps = {
		data: communityData?.communityById as AdminCommunityDetailContainerCommunityFieldsFragment,
	};

	return (
		<ComponentQueryLoader
			loading={communityLoading}
			hasData={communityData}
			hasDataComponent={<CommunityDetail {...communityDetailProps} />}
			error={communityError}
		/>
	);
};
