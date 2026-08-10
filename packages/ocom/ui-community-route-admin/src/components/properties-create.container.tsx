import { useMutation } from '@apollo/client';
import { App } from 'antd';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import type { PropertyCreateInput } from '../generated.tsx';
import { AdminPropertiesCreateContainerPropertyCreateDocument, AdminPropertiesListContainerPropertiesDocument } from '../generated.tsx';
import { PropertiesCreate } from './properties-create.tsx';

interface PropertiesCreateContainerProps {
	data: {
		communityId: string;
	};
}

export const PropertiesCreateContainer: React.FC<PropertiesCreateContainerProps> = (props) => {
	const navigate = useNavigate();
	const { message } = App.useApp();

	const [propertyCreate] = useMutation(AdminPropertiesCreateContainerPropertyCreateDocument, {
		refetchQueries: [
			{
				query: AdminPropertiesListContainerPropertiesDocument,
				variables: { communityId: props.data.communityId ?? '' },
			},
		],
	});

	const handleSave = async (values: PropertyCreateInput) => {
		try {
			const newProperty = await propertyCreate({
				variables: {
					input: {
						propertyName: values.propertyName,
					},
				},
			});

			if (newProperty.data?.propertyCreate.status?.success) {
				message.success('Property Created');
				navigate(`../${newProperty.data?.propertyCreate.property?.id}`, { replace: true });
			} else {
				message.error(newProperty.data?.propertyCreate.status?.errorMessage || 'Failed to create property');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating property';
			message.error(errorMessage);
		}
	};

	return <PropertiesCreate onSave={handleSave} />;
};
