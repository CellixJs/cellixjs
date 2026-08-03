import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { App } from 'antd';
import type React from 'react';
import { useParams } from 'react-router-dom';
import {
	SharedMemberProfileContainerMemberDocument,
	SharedMemberProfileContainerMemberSelfProfileDocument,
	SharedMemberProfileContainerMemberUpdateMyProfileDocument,
	SharedMemberProfileContainerMemberUpdateProfileDocument,
	type SharedMemberProfileContainerMemberFieldsFragment,
} from '../generated.tsx';
import { MemberProfile, type MemberProfileFormValues } from './member-profile.tsx';

export interface MemberProfileContainerProps {
	isAdmin?: boolean;
	mode?: 'admin' | 'self';
}

interface BuildMemberProfileSaveVariablesArgs {
	mode: 'admin' | 'self';
	communityId?: string;
	memberObjectId?: string;
	values: MemberProfileFormValues;
}

export const buildMemberProfileSaveVariables = ({ mode, communityId, memberObjectId, values }: BuildMemberProfileSaveVariablesArgs) => {
	if (mode === 'self') {
		return {
			variables: {
				communityId: communityId ?? '',
				input: {
					name: values.name,
					email: values.email,
					bio: values.bio,
					interests: [],
					visibility: {
						showEmail: values.showEmail,
						showBio: false,
						showInterests: values.showInterests,
						showProfile: values.showProfile,
						showLocation: values.showLocation,
						showProperties: values.showProperties,
					},
				},
			},
		};
	}

	return {
		variables: {
			input: {
				memberId: memberObjectId,
				profile: {
					name: values.name,
					email: values.email,
					bio: values.bio,
					showInterests: values.showInterests,
					showEmail: values.showEmail,
					showProfile: values.showProfile,
					showLocation: values.showLocation,
					showProperties: values.showProperties,
				},
			},
		},
	};
};

export const MemberProfileContainer: React.FC<MemberProfileContainerProps> = (props) => {
	const { message } = App.useApp();
	const { id, memberId, communityId } = useParams<{ id?: string; memberId?: string; communityId?: string }>();
	const memberObjectId = id ?? memberId;
	const isSelfMode = props.mode === 'self' || (!memberObjectId && Boolean(communityId));

	const [memberUpdateProfile, { loading: profileUpdateLoading, error: profileUpdateError }] = useMutation(SharedMemberProfileContainerMemberUpdateProfileDocument, {
		update(cache, { data }) {
			const updatedMember = data?.memberUpdateProfile.member;
			if (!updatedMember || !memberObjectId) {
				return;
			}

			cache.writeQuery({
				query: SharedMemberProfileContainerMemberDocument,
				variables: { id: memberObjectId },
				data: {
					member: updatedMember,
				},
			});
		},
	});

	const [memberUpdateMyProfile, { loading: selfProfileUpdateLoading, error: selfProfileUpdateError }] = useMutation(SharedMemberProfileContainerMemberUpdateMyProfileDocument, {
		update(cache, { data }) {
			const updatedMember = data?.memberUpdateMyProfile.member;
			if (!updatedMember || !communityId) {
				return;
			}

			cache.writeQuery({
				query: SharedMemberProfileContainerMemberSelfProfileDocument,
				variables: { communityId },
				data: {
					memberMyProfile: updatedMember,
				},
			});
		},
	});

	const {
		data: memberData,
		loading: memberLoading,
		error: memberError,
	} = useQuery(SharedMemberProfileContainerMemberDocument, {
		variables: {
			id: memberObjectId ?? '',
		},
		skip: isSelfMode || !memberObjectId,
	});

	const {
		data: memberSelfData,
		loading: memberSelfLoading,
		error: memberSelfError,
	} = useQuery(SharedMemberProfileContainerMemberSelfProfileDocument, {
		variables: {
			communityId: communityId ?? '',
		},
		skip: !isSelfMode || !communityId,
	});

	const handleSave = async (values: MemberProfileFormValues): Promise<boolean> => {
		if (isSelfMode) {
			if (!communityId) {
				message.error('Community not found');
				return false;
			}

			try {
				const variables = buildMemberProfileSaveVariables({
					mode: 'self',
					communityId,
					values,
				});
				const result = await memberUpdateMyProfile({ variables: variables.variables });
				if (result.data?.memberUpdateMyProfile.status.success) {
					message.success('Profile updated');
					return true;
				}
				message.error(result.data?.memberUpdateMyProfile.status.errorMessage ?? 'Failed to update profile');
				return false;
			} catch (saveError) {
				message.error(`Error updating profile: ${saveError instanceof Error ? saveError.message : JSON.stringify(saveError)}`);
				return false;
			}
		}

		if (!memberObjectId) {
			message.error('Member not found');
			return false;
		}

		try {
			const variables = buildMemberProfileSaveVariables({
				mode: 'admin',
				memberObjectId,
				values,
			});
			const result = await memberUpdateProfile({ variables: variables.variables });

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
		data: (isSelfMode ? memberSelfData?.memberMyProfile : memberData?.member) as SharedMemberProfileContainerMemberFieldsFragment,
		isAdmin: props.isAdmin ?? false,
		loading: isSelfMode ? selfProfileUpdateLoading : profileUpdateLoading,
		onSave: handleSave,
	};

	return (
		<ComponentQueryLoader
			loading={isSelfMode ? memberSelfLoading : memberLoading}
			hasData={isSelfMode ? memberSelfData?.memberMyProfile : memberData?.member}
			hasDataComponent={<MemberProfile {...memberProfileProps} />}
			error={isSelfMode ? memberSelfError ?? selfProfileUpdateError : memberError ?? profileUpdateError}
		/>
	);
};
