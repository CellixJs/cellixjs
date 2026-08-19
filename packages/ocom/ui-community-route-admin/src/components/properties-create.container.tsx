import { useMutation, useQuery } from '@apollo/client';
import { App } from 'antd';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import type { PropertyCreateInput } from '../generated.tsx';
import { AdminMemberListContainerMembersDocument, AdminPropertiesCreateContainerPropertyCreateDocument, AdminPropertiesListContainerPropertiesDocument } from '../generated.tsx';
import { PropertiesCreate } from './properties-create.tsx';
import type { PropertyFormMemberOption } from './property-form.tsx';

interface PropertiesCreateContainerProps {
	data: {
		communityId: string;
	};
}

export const PropertiesCreateContainer: React.FC<PropertiesCreateContainerProps> = (props) => {
	const navigate = useNavigate();
	const { message } = App.useApp();

	const { data: membersData, loading: membersLoading } = useQuery(AdminMemberListContainerMembersDocument, {
		variables: { communityId: props.data.communityId },
		skip: !props.data.communityId,
	});

	const [propertyCreate, { loading: createLoading }] = useMutation(AdminPropertiesCreateContainerPropertyCreateDocument, {
		refetchQueries: [
			{
				query: AdminPropertiesListContainerPropertiesDocument,
				variables: { communityId: props.data.communityId ?? '' },
			},
		],
	});

	const members: PropertyFormMemberOption[] = (membersData?.membersByCommunityId ?? []).map((member) => ({
		id: String(member.id),
		memberName: member.memberName,
	}));

	const handleSave = async (input: PropertyCreateInput) => {
		try {
			const newProperty = await propertyCreate({
				variables: {
					input,
				},
			});

			if (newProperty.data?.propertyCreate.status?.success) {
				message.success('Property Created');
				navigate('..', { replace: true });
			} else {
				message.error(newProperty.data?.propertyCreate.status?.errorMessage || 'Failed to create property');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating property';
			message.error(errorMessage);
		}
	};

	return (
		<PropertiesCreate
			members={members}
			membersLoading={membersLoading}
			submitting={createLoading}
			onSave={handleSave}
		/>
	);
};
