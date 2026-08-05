import { type Actor, notes, Question } from '@serenity-js/core';
import { communityPortalPageOf, openMemberAccountsListFor } from '../abilities/community-portal-page.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { CommunityId } from './community-id.ts';

const openAccountsList = async (actor: Actor, communityName: string) => {
	const memberId = await actor.answer(notes<MemberE2ENotes>().get('lastMemberId'));
	const routeMemberId = await actor.answer(notes<MemberE2ENotes>().get('routeMemberId'));
	if (!memberId || !routeMemberId) {
		throw new Error(`Missing member or route member state for account verification in "${communityName}"`);
	}

	return openMemberAccountsListFor(communityPortalPageOf(actor), await actor.answer(CommunityId(communityName)), routeMemberId, memberId);
};

export const MemberAccountLinked = (communityName: string, email: string) =>
	Question.about(`whether the member account list contains "${email}" in "${communityName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const memberAccountsPage = await openAccountsList(actor, communityName);
		await memberAccountsPage.linkedAccountEmail(email).waitFor({ state: 'visible', timeout: 15_000 });
		return await memberAccountsPage.linkedAccountEmail(email).isVisible();
	});

export const MemberAccountCount = (communityName: string, email: string) =>
	Question.about(`the number of rendered member account links for "${email}" in "${communityName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		return (await openAccountsList(actor, communityName)).linkedAccountCount(email);
	});
