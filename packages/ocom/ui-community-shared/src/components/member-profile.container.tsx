import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { App } from 'antd';
import type React from 'react';
import { useParams } from 'react-router-dom';
import {
	SharedMemberProfileContainerMemberDocument,
	type SharedMemberProfileContainerMemberFieldsFragment,
	SharedMemberProfileContainerMemberForCurrentCommunityDocument,
	SharedMemberProfileContainerMemberUpdateProfileDocument,
	type SharedMemberProfileContainerMemberUpdateProfileMutationVariables,
} from '../generated.tsx';
import { MemberProfile, type MemberProfileFormValues } from './member-profile.tsx';

export interface MemberProfileContainerProps {
	isAdmin?: boolean;
	mode?: 'admin' | 'self';
}

type SelfSaveVariables = {
	variables: SharedMemberProfileContainerMemberUpdateProfileMutationVariables;
};

type AdminSaveVariables = {
	variables: SharedMemberProfileContainerMemberUpdateProfileMutationVariables;
};

interface SelfBuildMemberProfileSaveVariablesArgs {
	mode: 'self';
	memberObjectId: string;
	values: MemberProfileFormValues;
}

interface AdminBuildMemberProfileSaveVariablesArgs {
	mode: 'admin';
	memberObjectId: string;
	values: MemberProfileFormValues;
}

type BuildMemberProfileSaveVariablesArgs = SelfBuildMemberProfileSaveVariablesArgs | AdminBuildMemberProfileSaveVariablesArgs;

function buildMemberProfileSaveVariables(args: SelfBuildMemberProfileSaveVariablesArgs): SelfSaveVariables;
function buildMemberProfileSaveVariables(args: AdminBuildMemberProfileSaveVariablesArgs): AdminSaveVariables;
function buildMemberProfileSaveVariables({ mode, ...rest }: BuildMemberProfileSaveVariablesArgs): SelfSaveVariables | AdminSaveVariables {
	if (mode === 'self') {
		const { memberObjectId, values } = rest as SelfBuildMemberProfileSaveVariablesArgs;
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
	}

	const { memberObjectId, values } = rest as AdminBuildMemberProfileSaveVariablesArgs;
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
}

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

	const [memberUpdateProfileMutation, { loading: selfProfileUpdateLoading, error: selfProfileUpdateError }] = useMutation(SharedMemberProfileContainerMemberUpdateProfileDocument, {
		update(cache, { data }) {
			const updatedMember = data?.memberUpdateProfile.member;
			if (updatedMember && communityId) {
				cache.writeQuery({
					query: SharedMemberProfileContainerMemberForCurrentCommunityDocument,
					variables: { communityId },
					data: {
						memberForCurrentCommunity: updatedMember,
					},
				});
			}

			if (updatedMember && memberObjectId) {
				cache.writeQuery({
					query: SharedMemberProfileContainerMemberDocument,
					variables: { id: memberObjectId },
					data: {
						member: updatedMember,
					},
				});
			}
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
	} = useQuery(SharedMemberProfileContainerMemberForCurrentCommunityDocument, {
		variables: {
			communityId: communityId ?? '',
		},
		skip: !isSelfMode || !communityId,
	});

	const handleSave = async (values: MemberProfileFormValues): Promise<boolean> => {
		if (isSelfMode) {
			const memberIdForUpdate = memberSelfData?.memberForCurrentCommunity?.id ?? memberObjectId;
			if (!memberIdForUpdate) {
				message.error('Community member not found');
				return false;
			}

			try {
				const variables = buildMemberProfileSaveVariables({
					mode: 'self',
					memberObjectId: String(memberIdForUpdate),
					values,
				});
				const result = await memberUpdateProfileMutation({ variables: variables.variables });
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
		data: (isSelfMode ? memberSelfData?.memberForCurrentCommunity : memberData?.member) as SharedMemberProfileContainerMemberFieldsFragment,
		isAdmin: props.isAdmin ?? false,
		loading: isSelfMode ? selfProfileUpdateLoading : profileUpdateLoading,
		onSave: handleSave,
	};

	return (
		<ComponentQueryLoader
			loading={isSelfMode ? memberSelfLoading : memberLoading}
			hasData={isSelfMode ? memberSelfData?.memberForCurrentCommunity : memberData?.member}
			hasDataComponent={<MemberProfile {...memberProfileProps} />}
			error={isSelfMode ? (memberSelfError ?? selfProfileUpdateError) : (memberError ?? profileUpdateError)}
		/>
	);
};
