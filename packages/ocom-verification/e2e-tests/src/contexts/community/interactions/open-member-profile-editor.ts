import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { communityPortalPageOf, openMemberProfileEditorFor } from '../abilities/community-portal-page.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { CommunityId } from '../questions/community-id.ts';
import { RouteMemberId } from '../questions/route-member-id.ts';

export const OpenMemberProfileEditor = (actor: Actor, communityName: string, memberName: string) =>
	Interaction.where(the`#actor opens the profile editor for "${memberName}" in "${communityName}"`, async () => {
		const page = communityPortalPageOf(actor);
		const communityId = await actor.answer(CommunityId(communityName));
		const memberId = await actor.answer(notes<MemberE2ENotes>().get('lastMemberId'));
		if (!memberId) {
			throw new Error(`Missing member state for profile update in "${communityName}"`);
		}
		const routeMemberId = await actor.answer(RouteMemberId(communityName));

		await openMemberProfileEditorFor(page, communityId, routeMemberId, memberId);
	});
