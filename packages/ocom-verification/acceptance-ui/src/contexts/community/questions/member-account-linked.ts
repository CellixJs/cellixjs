import { notes, Question } from '@serenity-js/core';
import type { MemberUiNotes } from '../notes/member-notes.ts';

export const MemberAccountLinked = (endUserId: string) =>
	Question.about('whether the member account was linked', async (actor) => {
		const linked = await actor.answer(notes<MemberUiNotes>().get('memberAccountLinked'));
		const linkedEndUserId = await actor.answer(notes<MemberUiNotes>().get('lastLinkedEndUserId'));
		return linked && linkedEndUserId === endUserId;
	});
