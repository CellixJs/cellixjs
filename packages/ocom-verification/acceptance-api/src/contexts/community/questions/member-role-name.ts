import { type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import type { MemberNotes } from '../notes/member-notes.ts';

export class MemberRoleName extends Question<Promise<string | null>> {
	static fromLastUpdate(): MemberRoleName {
		return new MemberRoleName();
	}

	private constructor() {
		super('role name returned by the member update');
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string | null> {
		const roleName = await actor.answer(notes<MemberNotes>().get('lastMemberRoleName'));
		return roleName || null;
	}
}
