import { type Actor, Interaction, the } from '@serenity-js/core';
import { communityPortalPageOf, openMemberCreateFormFor } from '../abilities/community-portal-page.ts';
import { CommunityId } from '../questions/community-id.ts';
import { RouteMemberId } from '../questions/route-member-id.ts';

export const OpenCreateMemberForm = (actor: Actor, communityName: string) =>
	Interaction.where(the`#actor opens the create member form for "${communityName}"`, async () => {
		const page = communityPortalPageOf(actor);
		const communityId = await actor.answer(CommunityId(communityName));
		const routeMemberId = await actor.answer(RouteMemberId(communityName));

		await openMemberCreateFormFor(page, communityId, routeMemberId);
	});
