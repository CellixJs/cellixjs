import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { communityPortalPageOf, openMemberListFor } from '../abilities/community-portal-page.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { CommunityId } from '../questions/community-id.ts';
import { HasNoMemberForCommunity } from '../questions/has-no-member-for-community.ts';
import { RouteMemberId } from '../questions/route-member-id.ts';

export const RemoveMember = (actor: Actor, communityName: string, memberName: string) =>
	Interaction.where(the`#actor removes member "${memberName}" from "${communityName}"`, async () => {
		const page = communityPortalPageOf(actor);
		const communityId = await actor.answer(CommunityId(communityName));
		const routeMemberId = await actor.answer(RouteMemberId(communityName));

		let memberListPage: Awaited<ReturnType<typeof openMemberListFor>>;
		try {
			memberListPage = await openMemberListFor(page, communityId, routeMemberId);
		} catch (error) {
			if (await actor.answer(HasNoMemberForCommunity.inCommunity(communityId))) {
				const message = `Unauthorized: no community membership for "${communityName}"`;
				await actor.attemptsTo(notes<MemberE2ENotes>().set('errorMessage', message));
				throw new Error(message);
			}
			throw error;
		}
		await memberListPage.memberName(memberName).waitFor({ state: 'visible', timeout: 15_000 });
		await memberListPage.clickRemoveMember(memberName);

		const outcome = await Promise.race([
			memberListPage
				.memberName(memberName)
				.waitFor({ state: 'hidden', timeout: 15_000 })
				.then(() => 'removed' as const),
			memberListPage.errorToast.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'denied' as const),
		]);
		if (outcome === 'denied') {
			const message = (await memberListPage.errorToast.textContent()) || 'Member removal was denied';
			await actor.attemptsTo(notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		await actor.attemptsTo(notes<MemberE2ENotes>().set('errorMessage', null));
	});
