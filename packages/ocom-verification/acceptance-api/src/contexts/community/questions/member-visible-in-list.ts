import { type AnswersQuestions, notes, Question } from '@serenity-js/core';
import type { MemberNotes } from '../notes/member-notes.ts';

export class MemberVisibleInList extends Question<Promise<boolean>> {
	static named(memberName: string): MemberVisibleInList {
		return new MemberVisibleInList(memberName);
	}

	private constructor(private readonly memberName: string) {
		super(`whether member "${memberName}" is visible in the member list`);
	}

	override async answeredBy(actor: AnswersQuestions): Promise<boolean> {
		const memberNames = await actor.answer(notes<MemberNotes>().get('listedMemberNames'));
		return memberNames.includes(this.memberName);
	}
}
