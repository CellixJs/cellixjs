import { type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { readCommunityMembers, readCommunitySubscription } from './community-billing.ts';

export class BilledMemberCount extends Question<Promise<number>> {
	constructor() {
		super('the billed member count');
	}

	static of(): BilledMemberCount {
		return new BilledMemberCount();
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<number> {
		const subscription = await readCommunitySubscription(actor);
		if (subscription?.memberCount !== undefined) {
			return subscription.memberCount;
		}
		return (await readCommunityMembers(actor)).length;
	}

	override toString = () => 'the billed member count';
}
