import { Interaction, the } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf, performBillingAction } from '../abilities/community-portal-page.ts';

export const SaveSubscriptionPlan = () =>
	Interaction.where(the`#actor saves the subscription plan`, async (actor) => {
		const page = communityBrowserPageOf(actor);
		// Saving submits a subscription tier update, a payment instrument update, or both.
		await performBillingAction(page, 'AdminCommunityBillingContainerCommunityUpdate', () => billingPageOn(page).clickSavePlan());
	});
