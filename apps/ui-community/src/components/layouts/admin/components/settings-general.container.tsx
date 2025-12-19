import { useMutation, useQuery } from '@apollo/client';
import { message } from 'antd';
import {
	AdminSettingsGeneralContainerCommunityUpdateSettingsDocument,
	AdminSettingsGeneralContainerCurrentCommunityDocument,
	type CommunityUpdateSettingsInput,
} from '../../../../generated.tsx';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { SettingsGeneral } from './settings-general.tsx';

export const SettingsGeneralContainer: React.FC = () => {
	const [communityUpdate, { error: mutationError }] = useMutation(
		AdminSettingsGeneralContainerCommunityUpdateSettingsDocument,
	);
	const {
		data: communityData,
		loading: communityLoading,
		error: communityError,
	} = useQuery(AdminSettingsGeneralContainerCurrentCommunityDocument);

	const handleSave = async (values: CommunityUpdateSettingsInput) => {
		if (!communityData?.currentCommunity?.id) {
			message.error('Community not found');
			return;
		}

		values.id = communityData.currentCommunity.id;
		try {
			await communityUpdate({
				variables: {
					input: values,
				},
			}).then((result) => {
				if (result.data?.communityUpdateSettings?.status?.success) {
					message.success('Saved');
				} else {
					message.error(
						result.data?.communityUpdateSettings.status.errorMessage ?? 'Unknown error',
					);
				}
			});
		} catch (saveError) {
			message.error(`Error updating community: ${JSON.stringify(saveError)}`);
		}
	};

	return (
		<ComponentQueryLoader
			loading={communityLoading}
			hasData={communityData?.currentCommunity}
			hasDataComponent={
				communityData?.currentCommunity ? (
					<SettingsGeneral onSave={handleSave} data={communityData.currentCommunity} />
				) : null
			}
			error={communityError ?? mutationError}
		/>
	);
};
