import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { communityPortalPageOf, openMemberAccountAssignmentFor } from '../abilities/community-portal-page.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { CommunityId } from '../questions/community-id.ts';
import { RouteMemberId } from '../questions/route-member-id.ts';

export const OpenMemberAccountAssignment = (actor: Actor, communityName: string) =>
	Interaction.where(the`#actor opens member account assignment in "${communityName}"`, async () => {
		const page = communityPortalPageOf(actor);
		const communityId = await actor.answer(CommunityId(communityName));
		const memberId = await actor.answer(notes<MemberE2ENotes>().get('lastMemberId'));
		if (!memberId) {
			throw new Error(`Missing member state for account assignment in "${communityName}"`);
		}
		const routeMemberId = await actor.answer(RouteMemberId(communityName));

		await openMemberAccountAssignmentFor(page, communityId, routeMemberId, memberId);
	});
