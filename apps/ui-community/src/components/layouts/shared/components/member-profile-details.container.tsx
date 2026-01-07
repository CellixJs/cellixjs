import { App } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import {
	type MemberProfileInput,
	SharedMemberProfileDetailsContainerMemberDocument,
	SharedMemberProfileDetailsContainerMemberProfileUpdateDocument,
} from '../../../../generated.tsx';
import { MemberProfileDetails } from './member-profile-details.tsx';

interface MemberProfileDetailsContainerProps {
	data: {
		id: string;
	};
}

export const MemberProfileDetailsContainer: React.FC<
	MemberProfileDetailsContainerProps
> = (props) => {
	const { message } = App.useApp();
	const [updateMember] = useMutation(
		SharedMemberProfileDetailsContainerMemberProfileUpdateDocument,
	);
	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery(SharedMemberProfileDetailsContainerMemberDocument, {
		variables: {
			id: props.data.id,
		},
	});

	const handleSave = async (values: MemberProfileInput) => {
		try {
			const result = await updateMember({
				variables: {
					input: {
						memberId: props.data.id,
						profile: values,
					},
				},
			});
			if (result.data?.memberProfileUpdate.status.success) {
				message.success('Saved');
			} else {
				message.error(
					`Error updating Member: ${result.data?.memberProfileUpdate.status.errorMessage}`,
				);
			}
		} catch (error) {
			message.error(`Error updating Member: ${JSON.stringify(error)}`);
		}
	};

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={memberData?.member}
			hasDataComponent={
				<MemberProfileDetails
					data={memberData?.member?.profile}
					onSave={handleSave}
				/>
			}
			error={memberError}
		/>
	);
};
