import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { App, Result } from 'antd';
import type React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	AdminPropertiesDetailContainerPropertyDeleteDocument,
	AdminPropertiesDetailContainerPropertyDocument,
	type AdminPropertiesDetailContainerPropertyFieldsFragment,
	AdminPropertiesDetailContainerPropertyUpdateDocument,
	AdminPropertiesListContainerPropertiesDocument,
	type PropertyUpdateInput,
} from '../generated.tsx';
import { PropertiesDetail, type PropertiesDetailFormValues, type PropertiesDetailProps } from './properties-detail.tsx';

interface PropertiesDetailContainerProps {
	data: {
		id: string;
	};
}

export const PropertiesDetailContainer: React.FC<PropertiesDetailContainerProps> = (props) => {
	const { communityId } = useParams<{ communityId: string }>();
	const navigate = useNavigate();
	const { message } = App.useApp();

	const {
		data: propertyData,
		loading: propertyLoading,
		error: propertyError,
	} = useQuery(AdminPropertiesDetailContainerPropertyDocument, {
		variables: {
			id: props.data.id,
		},
		skip: !props.data.id,
	});

	const [propertyUpdate, { loading: updateLoading }] = useMutation(AdminPropertiesDetailContainerPropertyUpdateDocument);
	const [propertyDelete, { loading: deleteLoading }] = useMutation(AdminPropertiesDetailContainerPropertyDeleteDocument, {
		update: (cache, result) => {
			// Only evict once the server confirms the deletion; a failed delete must keep serving details
			if (!result.data?.propertyDelete.status?.success) {
				return;
			}
			const cacheId = cache.identify({ __typename: 'Property', id: props.data.id });
			if (cacheId) {
				cache.evict({ id: cacheId });
				cache.gc();
			}
		},
		// Refetch the list only after a confirmed deletion, and don't await it:
		// a refetch failure must not make a successful removal look failed.
		refetchQueries: (result) =>
			result.data?.propertyDelete.status?.success
				? [
						{
							query: AdminPropertiesListContainerPropertiesDocument,
							variables: { communityId: communityId ?? '' },
						},
					]
				: [],
	});

	const handleSave = async (values: PropertiesDetailFormValues) => {
		// Explicit null means "clear this value" for numeric listing fields; only undefined is omitted.
		// An empty property type is omitted entirely: the domain has no "cleared" state for it.
		const input: PropertyUpdateInput = {
			id: props.data.id,
			propertyName: values.propertyName,
			...(values.propertyType?.trim() ? { propertyType: values.propertyType } : {}),
			listingDetail: {
				...(values.listingDetail?.bedrooms !== undefined ? { bedrooms: values.listingDetail.bedrooms } : {}),
				...(values.listingDetail?.bathrooms !== undefined ? { bathrooms: values.listingDetail.bathrooms } : {}),
				...(values.listingDetail?.squareFeet !== undefined ? { squareFeet: values.listingDetail.squareFeet } : {}),
			},
		};
		try {
			const result = await propertyUpdate({
				variables: {
					input,
				},
			});

			if (result.data?.propertyUpdate.status?.success) {
				message.success('Saved');
			} else {
				message.error(result.data?.propertyUpdate.status?.errorMessage || 'Failed to update property');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating property';
			message.error(errorMessage);
		}
	};

	const handleRemove = async () => {
		try {
			const result = await propertyDelete({
				variables: {
					input: {
						id: props.data.id,
					},
				},
			});

			if (result.data?.propertyDelete.status?.success) {
				message.success('Property Removed');
				navigate('../');
			} else {
				message.error(result.data?.propertyDelete.status?.errorMessage || 'Failed to remove property');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An error occurred while removing property';
			message.error(errorMessage);
		}
	};

	const propertiesDetailProps: PropertiesDetailProps = {
		data: propertyData?.property as AdminPropertiesDetailContainerPropertyFieldsFragment,
		onSave: handleSave,
		onRemove: handleRemove,
		saving: updateLoading,
		removing: deleteLoading,
	};

	return (
		<ComponentQueryLoader
			loading={propertyLoading}
			hasData={propertyData?.property}
			hasDataComponent={<PropertiesDetail {...propertiesDetailProps} />}
			noDataComponent={
				<Result
					status="404"
					title="Property Not Found"
					subTitle="The property you are looking for does not exist or has been removed."
				/>
			}
			error={propertyError}
		/>
	);
};
