import { type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { readCommunitySubscription } from './community-billing.ts';

export class BillingCurrency extends Question<Promise<string>> {
	constructor() {
		super('the billing currency');
	}

	static displayed(): BillingCurrency {
		return new BillingCurrency();
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const subscription = await readCommunitySubscription(actor);
		if (!subscription?.currency) {
			throw new Error('No billing currency was returned. Did the actor view a community subscription first?');
		}
		return subscription.currency;
	}

	override toString = () => 'the billing currency';
}
