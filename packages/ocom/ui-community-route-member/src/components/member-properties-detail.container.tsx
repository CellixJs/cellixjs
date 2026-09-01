import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { App, Result } from 'antd';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { MemberPropertiesListDocument, MemberPropertyDetailDocument, MemberPropertyUpdateDocument } from '../generated.tsx';
import { useMemberPropertiesAccess } from './member-properties-access.context.ts';
import { MemberPropertiesDetail } from './member-properties-detail.tsx';

interface MemberPropertiesDetailContainerProps {
	id: string;
}

const notFound = (
	<Result
		status="404"
		title="Property Not Found"
		subTitle="The property you are looking for does not exist or has been removed."
	/>
);

export const MemberPropertiesDetailContainer: React.FC<MemberPropertiesDetailContainerProps> = ({ id }) => {
	const navigate = useNavigate();
	const { communityId, memberId, revalidate } = useMemberPropertiesAccess();
	const { message } = App.useApp();
	const { data, loading, error } = useQuery(MemberPropertyDetailDocument, {
		variables: { id },
		skip: !id,
		fetchPolicy: 'network-only',
	});
	const [propertyUpdate, { loading: saving }] = useMutation(MemberPropertyUpdateDocument, {
		refetchQueries: [{ query: MemberPropertiesListDocument, variables: { communityId } }],
	});

	const saveProperty = async (input: Parameters<React.ComponentProps<typeof MemberPropertiesDetail>['onSave']>[0]): Promise<boolean> => {
		try {
			const result = await propertyUpdate({ variables: { input } });
			if (result.data?.propertyUpdate.status.success) {
				message.success('Saved');
				return true;
			}
			message.error(result.data?.propertyUpdate.status.errorMessage || 'Failed to update property');
		} catch (mutationError) {
			message.error(mutationError instanceof Error ? mutationError.message : 'An error occurred while updating property');
		}
		void revalidate();
		return false;
	};

	const property = data?.property;
	return (
		<ComponentQueryLoader
			loading={loading}
			hasData={property}
			hasDataComponent={
				property ? (
					<MemberPropertiesDetail
						key={String(property.id)}
						data={property}
						memberId={memberId}
						saving={saving}
						onSave={saveProperty}
						onSaveAndClose={async (input) => {
							if (await saveProperty(input)) {
								navigate('..');
								return true;
							}
							return false;
						}}
					/>
				) : (
					notFound
				)
			}
			noDataComponent={notFound}
			error={error}
		/>
	);
};
