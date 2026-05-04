import { type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import type { CommunityNotes } from '../abilities/community-types.ts';

export class CommunityStatus extends Question<Promise<string>> {
	constructor() {
		super('community status');
	}

	static of(): CommunityStatus {
		return new CommunityStatus();
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const notedStatus = await this.readNote(actor, 'lastCommunityStatus');
		if (!notedStatus) {
			throw new Error('No community status found in actor notes. Did the actor create a community first?');
		}
		return notedStatus;
	}

	override toString(): string {
		return 'the community status';
	}

	private async readNote(actor: AnswersQuestions & UsesAbilities, key: keyof CommunityNotes): Promise<string | undefined> {
		try {
			return await actor.answer(notes<Record<typeof key, string>>().get(key));
		} catch {
			return undefined;
		}
	}
}
