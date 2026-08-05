import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { communityPortalPageOf, memberCreatePageOn } from '../abilities/community-portal-page.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

export const FillMemberCreateForm = (actor: Actor, memberName: string) =>
	Interaction.where(the`#actor fills the member create form for "${memberName}"`, async () => {
		const memberCreatePage = memberCreatePageOn(communityPortalPageOf(actor));
		await memberCreatePage.fillMemberName(memberName);
		await actor.attemptsTo(notes<MemberE2ENotes>().set('lastMemberName', memberName));
	});
