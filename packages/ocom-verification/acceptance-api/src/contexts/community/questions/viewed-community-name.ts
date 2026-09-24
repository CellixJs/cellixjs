import { type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import type { CommunityNotes } from '../notes/community-notes.ts';

/**
 * Question that reads the community name observed by the actor's most recent
 * view flow (recorded in `lastViewedCommunityName`).
 */
export class ViewedCommunityName extends Question<Promise<string>> {
	static displayed(): ViewedCommunityName {
		return new ViewedCommunityName();
	}

	private constructor() {
		super('viewed community name');
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		let viewedName: string | undefined;
		try {
			viewedName = await actor.answer(notes<CommunityNotes>().get('lastViewedCommunityName'));
		} catch {
			viewedName = undefined;
		}

		if (!viewedName) {
			throw new Error('No viewed community name found in actor notes. Did the actor view a community first?');
		}
		return viewedName;
	}

	override toString = () => 'viewed community name';
}
