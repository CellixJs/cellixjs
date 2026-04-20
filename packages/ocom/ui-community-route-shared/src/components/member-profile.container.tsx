import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { App } from 'antd';
import type React from 'react';
import { useParams } from 'react-router-dom';
import {
	type MemberProfileContainerMemberFieldsFragment,
	MemberProfileContainerMemberProfileDocument,
	type MemberProfileContainerMemberProfileQuery,
	type MemberProfileContainerMemberProfileQueryVariables,
	MemberProfileContainerMemberUpdateProfileDocument,
} from '../generated.tsx';
import { MemberProfile, type MemberProfileFormValues } from './member-profile.tsx';

export interface MemberProfileContainerProps {
	communityId: string;
	isAdmin?: boolean;
}

export const MemberProfileContainer: React.FC<MemberProfileContainerProps> = (props) => {
	const { message } = App.useApp();
	const { id, memberId } = useParams<{ id?: string; memberId?: string }>();
	const memberObjectId = id ?? memberId;

	const [memberUpdateProfile, { loading: profileUpdateLoading, error: profileUpdateError }] = useMutation(MemberProfileContainerMemberUpdateProfileDocument, {
		update(cache, { data }) {
			const updatedMember = data?.memberUpdateProfile.member;
			if (!updatedMember || !memberObjectId) {
				return;
			}

			cache.writeQuery<MemberProfileContainerMemberProfileQuery, MemberProfileContainerMemberProfileQueryVariables>({
				query: MemberProfileContainerMemberProfileDocument,
				variables: { id: memberObjectId },
				data: {
					member: updatedMember,
				},
			});
		},
	});

	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery<MemberProfileContainerMemberProfileQuery, MemberProfileContainerMemberProfileQueryVariables>(MemberProfileContainerMemberProfileDocument, {
		variables: {
			id: memberObjectId ?? '',
		},
		skip: !memberObjectId,
	});

	const handleSave = async (values: MemberProfileFormValues): Promise<boolean> => {
		if (!memberObjectId) {
			message.error('Member not found');
			return false;
		}

		try {
			const result = await memberUpdateProfile({
				variables: {
					input: {
						memberId: memberObjectId,
						profile: values,
					},
				},
			});

			if (result.data?.memberUpdateProfile.status.success) {
				message.success('Profile updated');
				return true;
			}

			message.error(result.data?.memberUpdateProfile.status.errorMessage ?? 'Failed to update profile');
			return false;
		} catch (saveError) {
			message.error(`Error updating profile: ${saveError instanceof Error ? saveError.message : JSON.stringify(saveError)}`);
			return false;
		}
	};

	const memberProfileProps = {
		data: memberData?.member as MemberProfileContainerMemberFieldsFragment,
		isAdmin: props.isAdmin ?? false,
		loading: profileUpdateLoading,
		onSave: handleSave,
	};

	return (
		<ComponentQueryLoader
			loading={memberLoading}
			hasData={memberData?.member}
			hasDataComponent={<MemberProfile {...memberProfileProps} />}
			error={memberError ?? profileUpdateError}
		/>
	);
};
