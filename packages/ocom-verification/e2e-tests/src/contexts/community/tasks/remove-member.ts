import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { MemberListPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { Response } from 'playwright';
import type { E2EMemberListPage } from '../../../shared/page-contracts.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

const membersOperationName = 'AdminMemberListContainerMembers';
const removeMemberOperationName = 'AdminMemberListContainerRemoveMember';

type RemoveMemberPayload = {
	data?: { removeMember?: { status?: { success?: boolean; errorMessage?: string | null } } };
	errors?: Array<{ message?: string }>;
};

const hasGraphqlOperation = (operationName: string) => (response: Response) => response.url().includes('/api/graphql') && response.request().method() === 'POST' && (response.request().postData()?.includes(operationName) ?? false);

const selectPayload = (payload: RemoveMemberPayload | RemoveMemberPayload[] | null): RemoveMemberPayload | null => {
	if (!Array.isArray(payload)) {
		return payload;
	}
	return payload.find((item) => item.data?.removeMember) ?? payload.find((item) => item.errors?.length) ?? null;
};

export const RemoveMember = (communityName: string, memberName: string) =>
	Interaction.where(the`#actor removes member "${memberName}" from "${communityName}" via UI`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);
		const communityIds = await actor.answer(notes<MemberE2ENotes>().get('communityIdsByName'));
		const communityId = communityIds[communityName];
		const adminMemberId = await actor.answer(notes<MemberE2ENotes>().get('principalMemberId')).catch(() => new URL(page.url()).pathname.match(/\/admin\/([^/]+)\/members\//)?.[1]);
		if (!communityId || !adminMemberId) {
			throw new Error(`Missing community or administrator state for removal from "${communityName}"`);
		}

		const membersResponse = page.waitForResponse(hasGraphqlOperation(membersOperationName), { timeout: 5_000 }).catch(() => null);
		await page.goto(`/community/${encodeURIComponent(communityId)}/admin/${encodeURIComponent(adminMemberId)}/members`, { waitUntil: 'networkidle' });
		if (!(await membersResponse)) {
			const message = 'User is not authorized for member management';
			await actor.attemptsTo(notes<MemberE2ENotes>().set('memberRemoved', false), notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		const memberListPage: E2EMemberListPage = new MemberListPage(new PlaywrightPageAdapter(page));
		const memberVisible = await memberListPage
			.memberName(memberName)
			.waitFor({ state: 'visible', timeout: 3_000 })
			.then(
				() => true,
				() => false,
			);
		if (!memberVisible) {
			const message = 'User is not authorized for member management';
			await actor.attemptsTo(notes<MemberE2ENotes>().set('memberRemoved', false), notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}
		const mutationResponse = page.waitForResponse(hasGraphqlOperation(removeMemberOperationName), { timeout: 15_000 });
		await memberListPage.clickRemoveMember(memberName);

		const response = await mutationResponse;
		const payload = selectPayload((await response.json().catch(() => null)) as RemoveMemberPayload | RemoveMemberPayload[] | null);
		const result = payload?.data?.removeMember;
		if (!response.ok() || payload?.errors?.length || result?.status?.success !== true) {
			const message =
				result?.status?.errorMessage ??
				payload?.errors
					?.map((error) => error.message)
					.filter(Boolean)
					.join('; ') ??
				'Member removal failed';
			await actor.attemptsTo(notes<MemberE2ENotes>().set('memberRemoved', false), notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		await memberListPage.memberName(memberName).waitFor({ state: 'hidden', timeout: 15_000 });
		await actor.attemptsTo(notes<MemberE2ENotes>().set('memberRemoved', true), notes<MemberE2ENotes>().set('errorMessage', null));
	});
