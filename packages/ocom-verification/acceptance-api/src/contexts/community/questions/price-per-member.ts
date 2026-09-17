import { type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { readCommunitySubscription } from './community-billing.ts';

export class PricePerMember extends Question<Promise<number>> {
	constructor() {
		super('the price per member in cents');
	}

	static inCents(): PricePerMember {
		return new PricePerMember();
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<number> {
		const subscription = await readCommunitySubscription(actor);
		if (subscription?.pricePerMember === undefined) {
			throw new Error('No price per member was returned. Did the actor view a community subscription first?');
		}
		return subscription.pricePerMember;
	}

	override toString = () => 'the price per member in cents';
}
