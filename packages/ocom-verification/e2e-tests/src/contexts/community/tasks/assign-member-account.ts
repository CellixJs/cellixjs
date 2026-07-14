import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { MemberAccountsPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { Response } from 'playwright';
import type { E2EMemberAccountsPage } from '../../../shared/page-contracts.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

const endUsersOperationName = 'AdminMembersAccountsAddContainerEndUsersByCommunity';
const createAccountOperationName = 'AdminMembersAccountsAddContainerMemberCreateAccount';
const memberAccountsOperationName = 'AdminMembersAccountsListContainerMember';

type GraphqlPayload<TData> = {
	data?: TData;
	errors?: Array<{ message?: string }>;
};

type CreateAccountPayload = GraphqlPayload<{
	memberCreateAccount?: {
		status?: { success?: boolean; errorMessage?: string | null };
		member?: { id?: string | null } | null;
	};
}>;

const hasGraphqlOperation = (operationName: string) => (response: Response) => response.url().includes('/api/graphql') && response.request().method() === 'POST' && (response.request().postData()?.includes(operationName) ?? false);

const selectGraphqlPayload = <TData>(payload: GraphqlPayload<TData> | Array<GraphqlPayload<TData>> | null, hasExpectedData: (data: TData | undefined) => boolean): GraphqlPayload<TData> | null => {
	if (!Array.isArray(payload)) {
		return payload;
	}
	return payload.find((item) => hasExpectedData(item.data)) ?? payload.find((item) => item.errors?.length) ?? null;
};

export const AssignMemberAccount = (communityName: string, displayName: string) =>
	Interaction.where(the`#actor assigns end-user account "${displayName}" in "${communityName}" via UI`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);
		const communityIds = await actor.answer(notes<MemberE2ENotes>().get('communityIdsByName'));
		const communityId = communityIds[communityName];
		const memberId = await actor.answer(notes<MemberE2ENotes>().get('lastMemberId'));
		const adminMemberId = new URL(page.url()).pathname.match(/\/admin\/([^/]+)\/members\//)?.[1];
		if (!communityId || !memberId || !adminMemberId) {
			throw new Error(`Missing community, member, or administrator state for account assignment in "${communityName}"`);
		}

		const endUsersResponse = page.waitForResponse(hasGraphqlOperation(endUsersOperationName), { timeout: 15_000 });
		await page.goto(`/community/${encodeURIComponent(communityId)}/admin/${encodeURIComponent(adminMemberId)}/members/${encodeURIComponent(memberId)}/accounts/add`, { waitUntil: 'networkidle' });
		await endUsersResponse;

		const memberAccountsPage: E2EMemberAccountsPage = new MemberAccountsPage(new PlaywrightPageAdapter(page));
		await memberAccountsPage.selectEndUser(displayName);

		const mutationResponse = page.waitForResponse(hasGraphqlOperation(createAccountOperationName), { timeout: 15_000 });
		const accountsResponse = page.waitForResponse(hasGraphqlOperation(memberAccountsOperationName), { timeout: 15_000 }).catch(() => null);
		await memberAccountsPage.clickAddMemberAccount();

		const response = await mutationResponse;
		const payload = selectGraphqlPayload((await response.json()) as CreateAccountPayload | CreateAccountPayload[], (data) => Boolean(data?.memberCreateAccount));
		const result = payload?.data?.memberCreateAccount;
		if (!response.ok() || payload?.errors?.length || result?.status?.success !== true || result.member?.id !== memberId) {
			const message =
				result?.status?.errorMessage ??
				payload?.errors
					?.map((error) => error.message)
					.filter(Boolean)
					.join('; ') ??
				'Member account assignment failed';
			await actor.attemptsTo(notes<MemberE2ENotes>().set('memberAccountLinked', false), notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		await accountsResponse;
		const accountCount = await actor.answer(notes<MemberE2ENotes>().get('memberAccountCount')).catch(() => 0);
		await actor.attemptsTo(notes<MemberE2ENotes>().set('memberAccountLinked', true), notes<MemberE2ENotes>().set('memberAccountCount', accountCount + 1), notes<MemberE2ENotes>().set('errorMessage', null));
	});
