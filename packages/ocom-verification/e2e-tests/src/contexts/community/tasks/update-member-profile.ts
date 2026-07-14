import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { MemberProfilePage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { Response } from 'playwright';
import type { E2EMemberProfilePage } from '../../../shared/page-contracts.ts';
import type { MemberE2ENotes, MemberProfileExpectation } from '../notes/member-notes.ts';

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
const membersForCurrentEndUserOperationName = 'AccountsCommunityListContainerMembersForCurrentEndUser';

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

type MembersForCurrentEndUserPayload = GraphqlPayload<{
	membersForCurrentEndUser?: Array<{
		id: string;
		isAdmin?: boolean | null;
		community?: { id: string } | null;
	}>;
}>;

export const UpdateMemberProfile = (details: UpdateMemberProfileDetails) =>
	Interaction.where(the`#actor updates member profile for "${details.memberName}" in "${details.communityName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);
		const memberProfilePage: E2EMemberProfilePage = new MemberProfilePage(new PlaywrightPageAdapter(page));
		const communityIdsByName = (await actor.answer(notes<MemberE2ENotes>().get('communityIdsByName')).catch(() => ({}) as Record<string, string>)) as Record<string, string>;
		const communityId = communityIdsByName[details.communityName] ?? null;
		if (!communityId) {
			throw new Error(`Unknown community "${details.communityName}". Ensure it was created in setup.`);
		}

		const memberId = (await actor.answer(notes<MemberE2ENotes>().get('lastMemberId')).catch(() => null)) as string | null;
		if (!memberId) {
			throw new Error('Cannot update member profile because no member id is available in notes');
		}

		// get owner member id
		const membersResponse = page.waitForResponse(hasGraphqlOperation(membersForCurrentEndUserOperationName), { timeout: 15_000 });
		await page.goto('/community/accounts', { waitUntil: 'networkidle' });
		const membersPayload = selectGraphqlPayload((await (await membersResponse).json()) as MembersForCurrentEndUserPayload | MembersForCurrentEndUserPayload[], (data) => Boolean(data?.membersForCurrentEndUser));
		const adminMemberId = membersPayload?.data?.membersForCurrentEndUser?.find((member) => member.isAdmin && member.community?.id === communityId)?.id;
		if (!adminMemberId) {
			throw new Error(`No administrator membership found for community "${communityId}"`);
		}

		await page.goto(`/community/${encodeURIComponent(communityId)}/admin/${encodeURIComponent(adminMemberId)}/members/${encodeURIComponent(memberId)}/profile`, { waitUntil: 'networkidle' });
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
		const validationError = await memberProfilePage.firstValidationError.isVisible().catch(() => false);
		if (validationError) {
			const errorText = await memberProfilePage.firstValidationError.textContent();
			await actor.attemptsTo(notes<MemberE2ENotes>().set('memberUpdated', false), notes<MemberE2ENotes>().set('errorMessage', errorText || 'Validation error'));
			return;
		}

		const mutationResponse = await mutationResponsePromise;
		if (mutationResponse) {
			const payload = selectGraphqlPayload((await mutationResponse.json().catch(() => null)) as MemberUpdateProfileMutationPayload | MemberUpdateProfileMutationPayload[] | null, (data) => Boolean(data?.memberUpdateProfile));
			const graphqlError = graphqlErrors(payload);
			const mutationResult = payload?.data?.memberUpdateProfile;
			const mutationError = mutationResult?.status?.errorMessage ?? graphqlError;

			if (!mutationResponse.ok() || graphqlError || mutationResult?.status?.success !== true) {
				const message =
					mutationError ||
					(mutationResult?.status?.success !== true ? `${memberUpdateProfileOperationName} did not report success: ${JSON.stringify(payload)}` : `Member update GraphQL request failed with HTTP ${mutationResponse.status()}`);
				await actor.attemptsTo(notes<MemberE2ENotes>().set('memberUpdated', false), notes<MemberE2ENotes>().set('errorMessage', message));
				throw new Error(message);
			}
		}

		await memberProfilePage.errorToast.waitFor({ state: 'visible', timeout: 1_000 }).catch(() => undefined);
		const hasErrorToast = await memberProfilePage.errorToast.isVisible().catch(() => false);
		if (hasErrorToast) {
			const errorText = await memberProfilePage.errorToast.textContent();
			const message = errorText || 'Member profile update failed';
			await actor.attemptsTo(notes<MemberE2ENotes>().set('memberUpdated', false), notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		await actor.attemptsTo(notes<MemberE2ENotes>().set('memberUpdated', true), notes<MemberE2ENotes>().set('errorMessage', null));
	});
