import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminPropertiesListContainerPropertiesDocument, type AdminPropertiesListContainerPropertyFieldsFragment } from '../generated.tsx';
import { PropertiesList, type PropertiesListProps } from './properties-list.tsx';

export const PropertiesListContainer: React.FC = () => {
	const { communityId } = useParams<{ communityId: string }>();
	const navigate = useNavigate();

	const {
		data: propertiesData,
		loading: propertiesLoading,
		error: propertiesError,
	} = useQuery(AdminPropertiesListContainerPropertiesDocument, {
		variables: { communityId: communityId ?? '' },
		skip: !communityId,
	});

	const handlePropertyView = (propertyId: string) => {
		navigate(propertyId);
	};

	const propertiesListProps: PropertiesListProps = {
		data: (propertiesData?.propertiesByCommunityId ?? []) as AdminPropertiesListContainerPropertyFieldsFragment[],
		onPropertyView: handlePropertyView,
	};

	return (
		<ComponentQueryLoader
			loading={propertiesLoading}
			hasData={propertiesData?.propertiesByCommunityId}
			hasDataComponent={<PropertiesList {...propertiesListProps} />}
			error={propertiesError}
		/>
	);
};
