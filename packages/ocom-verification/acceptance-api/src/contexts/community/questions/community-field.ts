import { type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import { QueryCommunity } from '../../../shared/abilities/query-community.ts';
import type { CommunityNotes } from '../notes/community-notes.ts';

type CommunityFieldName = 'name' | 'domain' | 'whiteLabelDomain' | 'handle';

/**
 * Question that reads a single settings field of the community the scenario is
 * acting on (the community noted as `lastCommunityId`), straight from the API.
 */
export class CommunityField extends Question<Promise<string>> {
	static named(fieldName: CommunityFieldName): CommunityField {
		return new CommunityField(fieldName);
	}

	private constructor(private readonly fieldName: CommunityFieldName) {
		super(`community ${fieldName}`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const communityId = await this.readNote(actor, 'lastCommunityId');
		if (!communityId) {
			throw new Error(`No community id found in actor notes; cannot read the community ${this.fieldName}. Did the actor act on a community first?`);
		}

		const community = await QueryCommunity.as(actor).byId(actor, communityId);
		if (!community) {
			throw new Error(`Community "${communityId}" was not found through the API`);
		}

		return String(community[this.fieldName] ?? '');
	}

	override toString = () => `community ${this.fieldName}`;

	private async readNote(actor: AnswersQuestions & UsesAbilities, key: keyof CommunityNotes): Promise<string | undefined> {
		try {
			return await actor.answer(notes<Record<typeof key, string>>().get(key));
		} catch {
			return undefined;
		}
	}
}
