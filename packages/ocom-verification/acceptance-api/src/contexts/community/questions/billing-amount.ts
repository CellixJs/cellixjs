import { type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { readCommunitySubscription } from './community-billing.ts';

export class BillingAmount extends Question<Promise<number>> {
	constructor() {
		super('the current billing amount in cents');
	}

	static inCents(): BillingAmount {
		return new BillingAmount();
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<number> {
		const subscription = await readCommunitySubscription(actor);
		if (subscription?.amount === undefined) {
			throw new Error('No billing amount was returned. Did the actor view a community subscription first?');
		}
		return subscription.amount;
	}

	override toString = () => 'the current billing amount in cents';
}
