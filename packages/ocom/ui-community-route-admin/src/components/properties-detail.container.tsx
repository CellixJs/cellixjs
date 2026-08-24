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
	AdminPropertiesOwnerOptionsDocument,
	type PropertyUpdateInput,
} from '../generated.tsx';
import { PropertiesDetail, type PropertiesDetailProps, type PropertiesDetailSaveInput } from './properties-detail.tsx';
import type { PropertyFormMemberOption } from './property-form.tsx';

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
		// Always revalidate against the server: the query is keyed only by
		// property id, so a cached entity viewed under one community must not
		// render beneath another community's route without a fresh
		// authorization check by the request's community context.
		fetchPolicy: 'network-only',
	});

	// Minimal owner-options lookup: property managers only need id + name, so
	// the fuller member-management operation (accounts, profile) is not used here.
	const { data: membersData, loading: membersLoading } = useQuery(AdminPropertiesOwnerOptionsDocument, {
		variables: { communityId: communityId ?? '' },
		skip: !communityId,
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

	const members: PropertyFormMemberOption[] = (membersData?.membersByCommunityId ?? []).map((member) => ({
		id: String(member.id),
		memberName: member.memberName,
	}));

	/**
	 * Shared save routine of the Save and Save & Close flows: reports the
	 * outcome via toasts and answers whether the update was confirmed, so
	 * callers can decide on navigation.
	 */
	const saveProperty = async (values: PropertiesDetailSaveInput): Promise<boolean> => {
		const input: PropertyUpdateInput = {
			id: props.data.id,
			...values,
		};
		try {
			const result = await propertyUpdate({
				variables: {
					input,
				},
			});

			if (result.data?.propertyUpdate.status?.success) {
				message.success('Saved');
				return true;
			}
			message.error(result.data?.propertyUpdate.status?.errorMessage || 'Failed to update property');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating property';
			message.error(errorMessage);
		}
		return false;
	};

	const handleSave = async (values: PropertiesDetailSaveInput) => {
		await saveProperty(values);
	};

	// Save & Close returns to the properties list only after a confirmed save.
	// `'..'` (not `'../'`) so the resolved list URL carries no trailing slash.
	const handleSaveAndClose = async (values: PropertiesDetailSaveInput) => {
		if (await saveProperty(values)) {
			navigate('..');
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
		members,
		membersLoading,
		onSave: handleSave,
		onSaveAndClose: handleSaveAndClose,
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
