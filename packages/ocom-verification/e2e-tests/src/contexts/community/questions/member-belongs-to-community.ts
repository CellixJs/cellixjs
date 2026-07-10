import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { type Actor, notes, Question } from '@serenity-js/core';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { gotoCommunityMembersListPage } from '../support/community-admin-navigation.ts';

export const MemberBelongsToCommunity = (memberName: string, communityName: string) =>
	Question.about(`whether member "${memberName}" belongs to community "${communityName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);

		const communityIdsByName = (await actor.answer(notes<MemberE2ENotes>().get('communityIdsByName')).catch(() => ({}) as Record<string, string>)) as Record<string, string>;
		const expectedCommunityId = communityIdsByName[communityName];
		if (!expectedCommunityId) {
			throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
		}

		const route = await gotoCommunityMembersListPage(page, communityName);
		if (route.communityId !== expectedCommunityId) {
			return false;
		}

		const memberCell = page.getByRole('cell', { name: memberName, exact: true }).first();
		await memberCell.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined);

		return memberCell.isVisible().catch(() => false);
	});
