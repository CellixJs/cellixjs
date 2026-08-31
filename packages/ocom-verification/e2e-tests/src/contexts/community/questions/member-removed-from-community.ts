import { type Actor, notes, Question } from '@serenity-js/core';
import { communityPortalPageOf, openMemberListFor } from '../abilities/community-portal-page.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { CommunityId } from './community-id.ts';

export const MemberRemovedFromCommunity = (communityName: string, memberName: string) =>
	Question.about(`whether member "${memberName}" is absent from "${communityName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const routeMemberId = await actor.answer(notes<MemberE2ENotes>().get('routeMemberId'));
		if (!routeMemberId) {
			throw new Error(`Missing route member state for member removal verification in "${communityName}"`);
		}

		const memberListPage = await openMemberListFor(communityPortalPageOf(actor), await actor.answer(CommunityId(communityName)), routeMemberId);
		await memberListPage.memberName(memberName).waitFor({ state: 'hidden', timeout: 15_000 });
		return true;
	});
