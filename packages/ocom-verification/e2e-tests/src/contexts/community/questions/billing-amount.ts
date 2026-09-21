import { Question } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf } from '../abilities/community-portal-page.ts';

export const BillingAmount = () =>
	Question.about('the current billing amount in cents', async (actor) => {
		const value = await billingPageOn(communityBrowserPageOf(actor)).displayedBillingAmountCents();
		if (value === undefined) {
			throw new Error('No billing amount is visible on the billing screen');
		}
		return value;
	});
