import { App } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import {
	AdminMembersDetailContainerMemberDocument,
	type AdminMembersDetailContainerMemberFieldsFragment,
	AdminMembersDetailContainerMemberUpdateDocument,
	type MemberUpdateInput,
} from '../../../../generated.tsx';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type { MembersDetailProps } from './members-detail.tsx';
import { MembersDetail } from './members-detail.tsx';

interface MembersDetailContainerProps {
	data: {
		id: string;
		communityId: string;
	};
}

export const MembersDetailContainer: React.FC<MembersDetailContainerProps> = (
	props,
) => {
	const { message } = App.useApp();
	const [updateMember, { loading: updateLoading }] = useMutation(
		AdminMembersDetailContainerMemberUpdateDocument,
	);
	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery(AdminMembersDetailContainerMemberDocument, {
		variables: {
			id: props.data.id,
		},
	});

	const handleSave = async (values: MemberUpdateInput) => {
		try {
			const result = await updateMember({
				variables: {
					input: values,
				},
			});

			if (result.data?.memberUpdate.status.success) {
				message.success('Saved');
			} else {
				message.error(
					`Error updating Member: ${result.data?.memberUpdate.status.errorMessage}`,
				);
			}
		} catch (error) {
			message.error(`Error updating Member: ${JSON.stringify(error)}`);
		}
	};

	const membersDetailProps: MembersDetailProps = {
		data: {
			member: (memberData?.member ??
				{}) as AdminMembersDetailContainerMemberFieldsFragment,
		},
		onSave: handleSave,
		loading: updateLoading,
	};

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={memberData?.member}
			hasDataComponent={<MembersDetail {...membersDetailProps} />}
			error={memberError}
		/>
	);
};
