import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { MemberCreatePage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { Response } from 'playwright';
import type { E2EMemberCreatePage } from '../../../shared/page-contracts.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { gotoCommunityMembersCreatePage } from '../support/community-admin-navigation.ts';

const createMemberOperationName = 'AdminMembersCreateContainerMemberCreate';

type GraphqlPayload<TData> = {
	data?: TData;
	errors?: Array<{ message?: string }>;
};

type MemberCreateGraphqlPayload = GraphqlPayload<{
	memberCreate?: {
		status?: {
			success?: boolean;
			errorMessage?: string | null;
		};
		member?: {
			id?: string | null;
			memberName?: string | null;
		} | null;
	};
}>;

const hasGraphqlOperation = (operationName: string) => (response: Response) => {
	if (!response.url().includes('/api/graphql') || response.request().method() !== 'POST') {
		return false;
	}

	return response.request().postData()?.includes(operationName) ?? false;
};

const selectGraphqlPayload = <TData>(payload: GraphqlPayload<TData> | Array<GraphqlPayload<TData>> | null, hasExpectedData: (data: TData | undefined) => boolean): GraphqlPayload<TData> | null => {
	if (!Array.isArray(payload)) {
		return payload;
	}

	return payload.find((item) => hasExpectedData(item.data)) ?? payload.find((item) => item.errors?.length) ?? null;
};

const graphqlErrors = (payload: { errors?: Array<{ message?: string }> } | null): string | undefined =>
	payload?.errors
		?.map((error) => error.message)
		.filter(Boolean)
		.join('; ');

export const CreateMember = (communityName: string, memberName: string) =>
	Interaction.where(the`#actor creates member "${memberName}" in "${communityName}" via UI`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);

		const { communityId } = await gotoCommunityMembersCreatePage(page, communityName);

		const adapter = new PlaywrightPageAdapter(page);
		const memberCreatePage: E2EMemberCreatePage = new MemberCreatePage(adapter);

		await memberCreatePage.fillMemberName(memberName);

		const createMutationResponse = page.waitForResponse(hasGraphqlOperation(createMemberOperationName), { timeout: 15_000 }).catch(() => null);
		await memberCreatePage.clickCreateMember();

		await memberCreatePage.firstValidationError.waitFor({ state: 'visible', timeout: 750 }).catch(() => undefined);
		const hasValidationError = await memberCreatePage.firstValidationError.isVisible().catch(() => false);
		if (hasValidationError) {
			const validationMessage = await memberCreatePage.firstValidationError.textContent();
			await actor.attemptsTo(
				notes<MemberE2ENotes>().set('lastMemberId', null),
				notes<MemberE2ENotes>().set('lastMemberCommunityId', communityId),
				notes<MemberE2ENotes>().set('lastMemberName', memberName),
				notes<MemberE2ENotes>().set('memberCreated', false),
				notes<MemberE2ENotes>().set('errorMessage', validationMessage || 'Validation error'),
			);
			return;
		}

		const mutationResponse = await createMutationResponse;
		if (!mutationResponse) {
			const message = `${createMemberOperationName} did not return a GraphQL response`;
			await actor.attemptsTo(
				notes<MemberE2ENotes>().set('lastMemberId', null),
				notes<MemberE2ENotes>().set('lastMemberCommunityId', communityId),
				notes<MemberE2ENotes>().set('lastMemberName', memberName),
				notes<MemberE2ENotes>().set('memberCreated', false),
				notes<MemberE2ENotes>().set('errorMessage', message),
			);
			throw new Error(message);
		}

		const payload = selectGraphqlPayload((await mutationResponse.json().catch(() => null)) as MemberCreateGraphqlPayload | MemberCreateGraphqlPayload[] | null, (data) => Boolean(data?.memberCreate));
		const graphqlError = graphqlErrors(payload);
		const mutationResult = payload?.data?.memberCreate;
		const mutationError = mutationResult?.status?.errorMessage ?? graphqlError;
		const createdMemberName = mutationResult?.member?.memberName ?? null;

		if (!mutationResponse.ok() || graphqlError || mutationResult?.status?.success !== true || (createdMemberName !== null && createdMemberName !== memberName)) {
			const message =
				mutationError ||
				(mutationResult?.status?.success !== true
					? `${createMemberOperationName} did not report success: ${JSON.stringify(payload)}`
					: createdMemberName !== memberName
						? `Expected created member name "${memberName}" but GraphQL returned "${createdMemberName ?? 'null'}"`
						: `Member create GraphQL request failed with HTTP ${mutationResponse.status()}`);

			await actor.attemptsTo(
				notes<MemberE2ENotes>().set('lastMemberId', null),
				notes<MemberE2ENotes>().set('lastMemberCommunityId', communityId),
				notes<MemberE2ENotes>().set('lastMemberName', memberName),
				notes<MemberE2ENotes>().set('memberCreated', false),
				notes<MemberE2ENotes>().set('errorMessage', message),
			);
			throw new Error(message);
		}

		const memberId = mutationResult?.member?.id ?? null;
		if (!memberId) {
			const message = `${createMemberOperationName} succeeded but returned no member id`;
			await actor.attemptsTo(
				notes<MemberE2ENotes>().set('lastMemberId', null),
				notes<MemberE2ENotes>().set('lastMemberCommunityId', communityId),
				notes<MemberE2ENotes>().set('lastMemberName', memberName),
				notes<MemberE2ENotes>().set('memberCreated', false),
				notes<MemberE2ENotes>().set('errorMessage', message),
			);
			throw new Error(message);
		}

		await page
			.waitForURL(new RegExp(`/community/${communityId}/admin/[^/]+/members/[^/?#]+(?:/.*)?(?:\\?.*)?$`), {
				timeout: 15_000,
			})
			.catch(() => undefined);
		await memberCreatePage.errorToast.waitFor({ state: 'visible', timeout: 1_000 }).catch(() => undefined);
		const hasErrorToast = await memberCreatePage.errorToast.isVisible().catch(() => false);
		if (hasErrorToast) {
			const errorText = await memberCreatePage.errorToast.textContent();
			const message = errorText || 'Member creation failed';
			await actor.attemptsTo(
				notes<MemberE2ENotes>().set('lastMemberId', null),
				notes<MemberE2ENotes>().set('lastMemberCommunityId', communityId),
				notes<MemberE2ENotes>().set('lastMemberName', memberName),
				notes<MemberE2ENotes>().set('memberCreated', false),
				notes<MemberE2ENotes>().set('errorMessage', message),
			);
			throw new Error(message);
		}

		await actor.attemptsTo(
			notes<MemberE2ENotes>().set('lastMemberId', memberId),
			notes<MemberE2ENotes>().set('lastMemberCommunityId', communityId),
			notes<MemberE2ENotes>().set('lastMemberName', memberName),
			notes<MemberE2ENotes>().set('memberCreated', true),
			notes<MemberE2ENotes>().set('errorMessage', null),
		);
	});
