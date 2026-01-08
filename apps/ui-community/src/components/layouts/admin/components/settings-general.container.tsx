import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { App } from 'antd';
import {
	type AdminSettingsGeneralContainerCommunityFieldsFragment,
	AdminSettingsGeneralContainerCommunityUpdateSettingsDocument,
	AdminSettingsGeneralContainerCurrentCommunityDocument,
	type CommunityUpdateSettingsInput,
} from '../../../../generated.tsx';
import {
	SettingsGeneral,
	type SettingsGeneralProps,
} from './settings-general.tsx';

export const SettingsGeneralContainer: React.FC = () => {
	const { message } = App.useApp();

	const [communityUpdate, { loading: mutationLoading, error: mutationError }] =
		useMutation(AdminSettingsGeneralContainerCommunityUpdateSettingsDocument);
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
			const result = await communityUpdate({
				variables: {
					input: values,
				},
			});

			if (result.data?.communityUpdateSettings?.status?.success) {
				message.success('Saved');
			} else {
				message.error(
					result.data?.communityUpdateSettings?.status?.errorMessage ??
						'Unknown error',
				);
			}
		} catch (saveError) {
			message.error(
				`Error updating community: ${saveError instanceof Error ? saveError.message : JSON.stringify(saveError)}`,
			);
		}
	};

	const settingsProps: SettingsGeneralProps = {
		onSave: handleSave,
		data: communityData?.currentCommunity as AdminSettingsGeneralContainerCommunityFieldsFragment,
		loading: mutationLoading,
	};

	return (
		<ComponentQueryLoader
			loading={communityLoading}
			hasData={communityData?.currentCommunity}
			hasDataComponent={<SettingsGeneral {...settingsProps} />}
			error={communityError ?? mutationError}
		/>
	);
};
