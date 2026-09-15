import { Question } from '@serenity-js/core';
import { billingPageFor } from '../tasks/community-screen.ts';

export const BillingAmount = () =>
	Question.about('the current billing amount in cents', async (actor) => {
		const value = await billingPageFor(actor).displayedBillingAmountCents();
		if (value === undefined) {
			throw new Error('No billing amount is visible on the billing screen');
		}
		return value;
	});
