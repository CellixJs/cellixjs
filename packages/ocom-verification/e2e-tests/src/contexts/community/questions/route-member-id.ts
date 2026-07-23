import { notes, Question } from '@serenity-js/core';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

export const RouteMemberId = (communityName: string) =>
	Question.about(`the administrator route member ID for "${communityName}"`, async (actor) => {
		const routeMemberId = await actor.answer(notes<MemberE2ENotes>().get('routeMemberId'));
		if (!routeMemberId) {
			throw new Error(`Missing administrator route member state for "${communityName}"`);
		}

		return routeMemberId;
	});
