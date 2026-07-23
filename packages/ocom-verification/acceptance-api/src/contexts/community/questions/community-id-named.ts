import { type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import type { MemberNotes } from '../notes/member-notes.ts';

/** Resolves the ID of a community created earlier in the current scenario. */
export class CommunityIdNamed extends Question<Promise<string>> {
	static called(communityName: string): CommunityIdNamed {
		return new CommunityIdNamed(communityName);
	}

	private constructor(private readonly communityName: string) {
		super(`ID of community "${communityName}"`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const communityIdsByName = await actor.answer(notes<MemberNotes>().get('communityIdsByName')).catch(() => ({}) as Record<string, string>);
		const communityId = communityIdsByName[this.communityName];
		if (!communityId) {
			throw new Error(`Unknown community "${this.communityName}". Ensure it was created in setup.`);
		}

		return communityId;
	}
}
