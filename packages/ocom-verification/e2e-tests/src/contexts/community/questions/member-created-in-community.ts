import { type Actor, notes, Question } from '@serenity-js/core';
import { communityPortalPageOf, openMemberListFor } from '../abilities/community-portal-page.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { CommunityId } from './community-id.ts';

export const MemberCreatedInCommunity = (communityName: string) =>
	Question.about(`whether the created member appears in "${communityName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const memberName = await actor.answer(notes<MemberE2ENotes>().get('lastMemberName'));
		const routeMemberId = await actor.answer(notes<MemberE2ENotes>().get('routeMemberId'));
		if (!memberName || !routeMemberId) {
			throw new Error(`Missing created member or route member state for "${communityName}"`);
		}

		const communityId = await actor.answer(CommunityId(communityName));
		const memberListPage = await openMemberListFor(communityPortalPageOf(actor), communityId, routeMemberId);
		await memberListPage.memberName(memberName).waitFor({ state: 'visible', timeout: 15_000 });
		return true;
	});
