import { Interaction, the } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf } from '../abilities/community-portal-page.ts';

export const SelectSubscriptionPlan = (plan: string) =>
	Interaction.where(the`#actor selects subscription plan "${plan}"`, async (actor) => {
		await billingPageOn(communityBrowserPageOf(actor)).selectSubscriptionPlan(plan);
	});
