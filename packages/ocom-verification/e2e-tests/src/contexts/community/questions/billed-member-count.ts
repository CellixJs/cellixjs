import { Question } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf } from '../abilities/community-portal-page.ts';

export const BilledMemberCount = () =>
	Question.about('the billed member count', async (actor) => {
		const value = await billingPageOn(communityBrowserPageOf(actor)).displayedMemberCount();
		if (value === undefined) {
			throw new Error('No billed member count is visible on the billing screen');
		}
		return value;
	});
