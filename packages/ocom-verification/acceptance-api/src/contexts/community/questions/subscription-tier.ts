import { toDisplayTier } from '@ocom-verification/verification-shared/test-data';
import { type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { readCommunityBilling, readCommunitySubscription } from './community-billing.ts';

export class SubscriptionTier extends Question<Promise<string>> {
	constructor() {
		super('the current subscription tier');
	}

	static displayed(): SubscriptionTier {
		return new SubscriptionTier();
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const subscription = await readCommunitySubscription(actor);
		if (subscription?.tier) {
			return toDisplayTier(subscription.tier);
		}
		const community = await readCommunityBilling(actor);
		return toDisplayTier(community.finance?.subscriptionTier);
	}

	override toString = () => 'the current subscription tier';
}
