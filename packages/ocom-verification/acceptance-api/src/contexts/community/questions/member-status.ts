import { type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import type { MemberNotes } from '../notes/member-notes.ts';

export class MemberStatus extends Question<Promise<string>> {
	constructor() {
		super('member status');
	}

	static of(): MemberStatus {
		return new MemberStatus();
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const notedStatus = await this.readNote(actor, 'lastMemberStatus');
		if (!notedStatus) {
			throw new Error('No member status found in actor notes. Did the actor create a member first?');
		}
		return notedStatus;
	}

	override toString(): string {
		return 'the member status';
	}

	private async readNote(actor: AnswersQuestions & UsesAbilities, key: keyof MemberNotes): Promise<string | undefined> {
		try {
			return await actor.answer(notes<Record<typeof key, string>>().get(key));
		} catch {
			return undefined;
		}
	}
}
