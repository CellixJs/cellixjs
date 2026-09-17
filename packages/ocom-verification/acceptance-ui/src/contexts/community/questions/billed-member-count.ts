import { Question } from '@serenity-js/core';
import { billingPageFor } from '../tasks/community-screen.ts';

export const BilledMemberCount = () =>
	Question.about('the billed member count', async (actor) => {
		const value = await billingPageFor(actor).displayedMemberCount();
		if (value === undefined) {
			throw new Error('No billed member count is visible on the billing screen');
		}
		return value;
	});
