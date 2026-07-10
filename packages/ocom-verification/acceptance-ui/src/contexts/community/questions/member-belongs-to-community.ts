import { notes, Question } from '@serenity-js/core';
import type { MemberUiNotes } from '../notes/member-notes.ts';

export const MemberBelongsToCommunity = (expectedMemberName: string, expectedCommunityName: string) =>
	Question.about(`whether member "${expectedMemberName}" belongs to "${expectedCommunityName}"`, async (actor) => {
		const actualMemberName = await actor.answer(notes<MemberUiNotes>().get('lastMemberName'));
		const actualCommunityName = await actor.answer(notes<MemberUiNotes>().get('lastMemberCommunityName'));

		return actualMemberName === expectedMemberName && actualCommunityName === expectedCommunityName;
	});
