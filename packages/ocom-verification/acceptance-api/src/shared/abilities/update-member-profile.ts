import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { MEMBER_UPDATE_PROFILE_MUTATION } from '../graphql/member-operations.ts';

export interface MemberProfileUpdate {
	name?: string;
	email?: string;
	bio?: string;
	avatarDocumentId?: string;
	interests?: string[];
	showInterests?: boolean;
	showEmail?: boolean;
	showProfile?: boolean;
	showLocation?: boolean;
	showProperties?: boolean;
}

interface UpdateMemberProfileDetails {
	memberId: string;
	profile: MemberProfileUpdate;
	communityId: string;
	principalMemberId: string;
}

interface UpdateMemberProfileResult {
	id?: string;
	profile?: MemberProfileUpdate;
}

type UpdateMemberProfileHandler = (actor: Actor, details: UpdateMemberProfileDetails) => Promise<UpdateMemberProfileResult>;

type ExecuteWithRequestOptions = <TData extends Record<string, unknown> = Record<string, unknown>>(
	query: string,
	variables?: Record<string, unknown>,
	options?: { headers?: Record<string, string> },
) => Promise<{ data: TData; errors?: Array<{ message?: string }> }>;

export class UpdateMemberProfile extends Ability {
	constructor(private readonly handler: UpdateMemberProfileHandler) {
		super();
	}

	static using(handler: UpdateMemberProfileHandler): UpdateMemberProfile {
		return new UpdateMemberProfile(handler);
	}

	async performAs(actor: Actor, details: UpdateMemberProfileDetails): Promise<UpdateMemberProfileResult> {
		return await this.handler(actor, details);
	}
}

export function updateMemberProfileAbility(): UpdateMemberProfile {
	return UpdateMemberProfile.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor) as GraphQLClient & { execute: ExecuteWithRequestOptions };
		if (!details.communityId) {
			throw new Error('communityId is required to update a member profile');
		}
		if (!details.memberId) {
			throw new Error('memberId is required to update a member profile');
		}
		if (!details.profile || Object.keys(details.profile).length === 0) {
			throw new Error('At least one profile field is required to update a member profile');
		}
		if (!details.principalMemberId) {
			throw new Error('principalMemberId is required to update a member profile');
		}

		const profileResponse = await graphql.execute(
			MEMBER_UPDATE_PROFILE_MUTATION,
			{
				input: {
					memberId: details.memberId,
					profile: {
						...(details.profile.name !== undefined ? { name: details.profile.name } : {}),
						...(details.profile.email !== undefined ? { email: details.profile.email } : {}),
						...(details.profile.bio !== undefined ? { bio: details.profile.bio } : {}),
						...(details.profile.avatarDocumentId !== undefined ? { avatarDocumentId: details.profile.avatarDocumentId } : {}),
						...(details.profile.interests !== undefined ? { interests: details.profile.interests } : {}),
						...(details.profile.showInterests !== undefined ? { showInterests: details.profile.showInterests } : {}),
						...(details.profile.showEmail !== undefined ? { showEmail: details.profile.showEmail } : {}),
						...(details.profile.showProfile !== undefined ? { showProfile: details.profile.showProfile } : {}),
						...(details.profile.showLocation !== undefined ? { showLocation: details.profile.showLocation } : {}),
						...(details.profile.showProperties !== undefined ? { showProperties: details.profile.showProperties } : {}),
					},
				},
			},
			{
				headers: {
					'x-community-id': details.communityId,
					'x-member-id': details.principalMemberId,
				},
			},
		);

		const updateResult = profileResponse.data?.['memberUpdateProfile'] as Record<string, unknown> | undefined;
		const updateStatus = updateResult?.['status'] as Record<string, unknown> | undefined;
		if (updateStatus?.['success'] !== true) {
			throw new Error(String(updateStatus?.['errorMessage'] ?? 'Failed to update member profile'));
		}

		const updatedMember = updateResult?.['member'] as Record<string, unknown> | undefined;
		const profile = updatedMember?.['profile'] as Record<string, unknown> | undefined;
		const interests = Array.isArray(profile?.['interests']) ? (profile?.['interests'] as Array<unknown>).map((value) => String(value)).filter((value) => value.length > 0) : undefined;

		return {
			id: String(updatedMember?.['id'] ?? details.memberId),
			profile: {
				...(profile?.['name'] !== undefined ? { name: String(profile['name'] ?? '') } : {}),
				...(profile?.['email'] !== undefined ? { email: String(profile['email'] ?? '') } : {}),
				...(profile?.['bio'] !== undefined ? { bio: String(profile['bio'] ?? '') } : {}),
				...(profile?.['avatarDocumentId'] !== undefined ? { avatarDocumentId: String(profile['avatarDocumentId'] ?? '') } : {}),
				...(interests !== undefined ? { interests } : {}),
				...(profile?.['showInterests'] !== undefined ? { showInterests: Boolean(profile['showInterests']) } : {}),
				...(profile?.['showEmail'] !== undefined ? { showEmail: Boolean(profile['showEmail']) } : {}),
				...(profile?.['showProfile'] !== undefined ? { showProfile: Boolean(profile['showProfile']) } : {}),
				...(profile?.['showLocation'] !== undefined ? { showLocation: Boolean(profile['showLocation']) } : {}),
				...(profile?.['showProperties'] !== undefined ? { showProperties: Boolean(profile['showProperties']) } : {}),
			},
		};
	});
}
