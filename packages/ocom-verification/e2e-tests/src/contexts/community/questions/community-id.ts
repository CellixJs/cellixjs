import { notes, Question } from '@serenity-js/core';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

export const CommunityId = (communityName: string) =>
	Question.about(`the ID of community "${communityName}"`, async (actor) => {
		const communityIdsByName = await actor.answer(notes<MemberE2ENotes>().get('communityIdsByName'));
		const communityId = communityIdsByName[communityName];
		if (!communityId) {
			throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
		}
		return communityId;
	});
