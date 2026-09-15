import { Question } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf } from '../abilities/community-portal-page.ts';

export const PricePerMember = () =>
	Question.about('the price per member in cents', async (actor) => {
		const value = await billingPageOn(communityBrowserPageOf(actor)).displayedPricePerMemberCents();
		if (value === undefined) {
			throw new Error('No price per member is visible on the billing screen');
		}
		return value;
	});
