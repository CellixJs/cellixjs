import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type { AdminCommunityDetailContainerCommunityFieldsFragment } from '../../../../generated.tsx';
import { AdminCommunityDetailContainerCommunityByIdDocument } from '../../../../generated.tsx';
import { CommunityDetail } from './community-detail.tsx';

export interface CommunityDetailContainerProps {
	data: { id?: string };
}

export const CommunityDetailContainer: React.FC<
	CommunityDetailContainerProps
> = (props) => {
	const {
		data: communityData,
		loading: communityLoading,
		error: communityError,
	} = useQuery(AdminCommunityDetailContainerCommunityByIdDocument, {
		variables: { id: props.data.id ?? '' },
	});

	return (
		<ComponentQueryLoader
			loading={communityLoading}
			hasData={communityData}
			hasDataComponent={
				<CommunityDetail
					data={
						communityData?.communityById as AdminCommunityDetailContainerCommunityFieldsFragment
					}
				/>
			}
			error={communityError}
		/>
	);
};
