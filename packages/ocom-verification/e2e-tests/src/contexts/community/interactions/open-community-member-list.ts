import { type Actor, Interaction, the } from '@serenity-js/core';
import { communityPortalPageOf, openMemberListFor } from '../abilities/community-portal-page.ts';
import { CommunityId } from '../questions/community-id.ts';
import { RouteMemberId } from '../questions/route-member-id.ts';

export const OpenCommunityMemberList = (actor: Actor, communityName: string) =>
	Interaction.where(the`#actor opens the member list for "${communityName}"`, async () => {
		const page = communityPortalPageOf(actor);
		const communityId = await actor.answer(CommunityId(communityName));
		const routeMemberId = await actor.answer(RouteMemberId(communityName));

		await openMemberListFor(page, communityId, routeMemberId);
	});
