import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { MemberProfilePage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { Response } from 'playwright';
import type { E2EMemberProfilePage } from '../../../shared/page-contracts.ts';
import type { MemberE2ENotes, MemberProfileExpectation } from '../notes/member-notes.ts';
import { gotoCommunityMembersListPage } from '../support/community-admin-navigation.ts';

interface UpdateMemberProfileDetails {
	communityName: string;
	memberName: string;
	profile: MemberProfileExpectation;
}

type GraphqlPayload<TData> = {
	data?: TData;
	errors?: Array<{ message?: string }>;
};

const memberUpdateProfileOperationName = 'SharedMemberProfileContainerMemberUpdateProfile';

const hasGraphqlOperation = (operationName: string) => (response: Response) => {
	if (!response.url().includes('/api/graphql') || response.request().method() !== 'POST') {
		return false;
	}

	return response.request().postData()?.includes(operationName) ?? false;
};

const graphqlErrors = (payload: { errors?: Array<{ message?: string }> } | null): string | undefined =>
	payload?.errors
		?.map((error) => error.message)
		.filter(Boolean)
		.join('; ');

const selectGraphqlPayload = <TData>(payload: GraphqlPayload<TData> | Array<GraphqlPayload<TData>> | null, hasExpectedData: (data: TData | undefined) => boolean): GraphqlPayload<TData> | null => {
	if (!Array.isArray(payload)) {
		return payload;
	}

	return payload.find((item) => hasExpectedData(item.data)) ?? payload.find((item) => item.errors?.length) ?? null;
};

type MemberUpdateProfileMutationPayload = GraphqlPayload<{
	memberUpdateProfile?: {
		status?: {
			success?: boolean;
			errorMessage?: string | null;
		};
		member?: {
			id?: string | null;
		} | null;
	};
}>;

export const UpdateMemberProfile = (details: UpdateMemberProfileDetails) =>
	Interaction.where(the`#actor updates member profile for "${details.memberName}" in "${details.communityName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);
		const memberProfilePage: E2EMemberProfilePage = new MemberProfilePage(new PlaywrightPageAdapter(page));
		let memberId: string | null = null;
		let communityId: string | null = null;

		try {
			const route = await gotoCommunityMembersListPage(page, details.communityName);
			communityId = route.communityId;
			memberId = (await actor.answer(notes<MemberE2ENotes>().get('lastMemberId')).catch(() => null)) as string | null;
			if (!memberId) {
				throw new Error('Cannot update member profile because no member id is available in notes');
			}

			await page.goto(`/community/${route.communityId}/admin/${route.memberId}/members/${memberId}/profile`, {
				waitUntil: 'networkidle',
			});

			await memberProfilePage.clickEditProfile();

			if (details.profile.name !== undefined) await memberProfilePage.fillDisplayName(details.profile.name);
			if (details.profile.email !== undefined) await memberProfilePage.fillEmail(details.profile.email);
			if (details.profile.bio !== undefined) await memberProfilePage.fillBio(details.profile.bio);
			if (details.profile.showInterests !== undefined) await memberProfilePage.setShowInterests(details.profile.showInterests);
			if (details.profile.showEmail !== undefined) await memberProfilePage.setShowEmail(details.profile.showEmail);
			if (details.profile.showProfile !== undefined) await memberProfilePage.setShowProfile(details.profile.showProfile);
			if (details.profile.showLocation !== undefined) await memberProfilePage.setShowLocation(details.profile.showLocation);
			if (details.profile.showProperties !== undefined) await memberProfilePage.setShowProperties(details.profile.showProperties);

			const mutationResponsePromise = page.waitForResponse(hasGraphqlOperation(memberUpdateProfileOperationName), { timeout: 15_000 }).catch(() => null);
			await memberProfilePage.clickSaveProfile();

			await memberProfilePage.firstValidationError.waitFor({ state: 'visible', timeout: 750 }).catch(() => undefined);
			if (await memberProfilePage.firstValidationError.isVisible().catch(() => false)) {
				throw new Error((await memberProfilePage.firstValidationError.textContent()) || 'Validation error');
			}

			const mutationResponse = await mutationResponsePromise;

			if (!mutationResponse) {
				throw new Error(`${memberUpdateProfileOperationName} did not return a GraphQL response`);
			}

			const mutationPayload = selectGraphqlPayload((await mutationResponse.json().catch(() => null)) as MemberUpdateProfileMutationPayload | MemberUpdateProfileMutationPayload[] | null, (data) =>
				Boolean(data?.memberUpdateProfile),
			);
			const mutationError = mutationPayload?.data?.memberUpdateProfile?.status?.errorMessage ?? graphqlErrors(mutationPayload);
			const mutationResult = mutationPayload?.data?.memberUpdateProfile;
			const updatedMember = mutationResult?.member;

			if (!mutationResponse.ok() || mutationResult?.status?.success !== true || !updatedMember) {
				throw new Error(
					mutationError ||
						(mutationResult?.status?.success !== true
							? `${memberUpdateProfileOperationName} did not report success: ${JSON.stringify(mutationPayload)}`
							: `Member update GraphQL request failed with HTTP ${mutationResponse.status()}`),
				);
			}

			await memberProfilePage.errorToast.waitFor({ state: 'visible', timeout: 1_000 }).catch(() => undefined);
			if (await memberProfilePage.errorToast.isVisible().catch(() => false)) {
				throw new Error((await memberProfilePage.errorToast.textContent()) || 'Member profile update failed');
			}

			await actor.attemptsTo(
				notes<MemberE2ENotes>().set('lastMemberId', updatedMember.id ?? memberId),
				notes<MemberE2ENotes>().set('lastMemberCommunityId', route.communityId),
				notes<MemberE2ENotes>().set('lastMemberName', details.memberName),
				notes<MemberE2ENotes>().set('lastUpdatedMemberProfile', details.profile),
				notes<MemberE2ENotes>().set('lastMemberStatus', 'SUCCESS'),
				notes<MemberE2ENotes>().set('memberUpdated', true),
				notes<MemberE2ENotes>().set('errorMessage', null),
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await actor.attemptsTo(
				notes<MemberE2ENotes>().set('lastMemberId', memberId),
				notes<MemberE2ENotes>().set('lastMemberCommunityId', communityId),
				notes<MemberE2ENotes>().set('lastMemberName', details.memberName),
				notes<MemberE2ENotes>().set('lastMemberStatus', 'FAILED'),
				notes<MemberE2ENotes>().set('memberUpdated', false),
				notes<MemberE2ENotes>().set('errorMessage', message),
			);

			if (error instanceof Error) {
				throw error;
			}

			throw new Error(message);
		}
	});
