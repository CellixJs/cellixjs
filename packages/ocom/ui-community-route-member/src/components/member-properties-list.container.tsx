import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { MemberPropertiesListDocument } from '../generated.tsx';
import { useMemberPropertiesAccess } from './member-properties-access.context.ts';
import { MemberPropertiesList } from './member-properties-list.tsx';

export const MemberPropertiesListContainer: React.FC = () => {
	const navigate = useNavigate();
	const { communityId } = useMemberPropertiesAccess();
	const { data, loading, error } = useQuery(MemberPropertiesListDocument, {
		variables: { communityId },
		skip: !communityId,
	});

	return (
		<ComponentQueryLoader
			loading={loading}
			hasData={data?.propertiesByCommunityId}
			hasDataComponent={
				<MemberPropertiesList
					data={data?.propertiesByCommunityId ?? []}
					onPropertyView={(propertyId) => navigate(propertyId)}
				/>
			}
			error={error}
		/>
	);
};
