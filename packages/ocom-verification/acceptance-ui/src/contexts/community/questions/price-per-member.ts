import { Question } from '@serenity-js/core';
import { billingPageFor } from '../tasks/community-screen.ts';

export const PricePerMember = () =>
	Question.about('the price per member in cents', async (actor) => {
		const value = await billingPageFor(actor).displayedPricePerMemberCents();
		if (value === undefined) {
			throw new Error('No price per member is visible on the billing screen');
		}
		return value;
	});
