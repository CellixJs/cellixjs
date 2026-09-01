import { useMutation } from '@apollo/client';
import { App } from 'antd';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { MemberPropertiesListDocument, MemberPropertyCreateDocument } from '../generated.tsx';
import { useMemberPropertiesAccess } from './member-properties-access.context.ts';
import { MemberPropertiesCreate } from './member-properties-create.tsx';

export const MemberPropertiesCreateContainer: React.FC = () => {
	const navigate = useNavigate();
	const { communityId, revalidate } = useMemberPropertiesAccess();
	const { message } = App.useApp();
	const [propertyCreate, { loading }] = useMutation(MemberPropertyCreateDocument, {
		refetchQueries: [{ query: MemberPropertiesListDocument, variables: { communityId } }],
	});

	return (
		<MemberPropertiesCreate
			submitting={loading}
			onSave={async (input) => {
				try {
					const result = await propertyCreate({ variables: { input } });
					if (result.data?.propertyCreate.status.success) {
						message.success('Property Created');
						navigate('..', { replace: true });
						return;
					}
					message.error(result.data?.propertyCreate.status.errorMessage || 'Failed to create property');
				} catch (error) {
					message.error(error instanceof Error ? error.message : 'An error occurred while creating property');
				}
				void revalidate();
			}}
		/>
	);
};
