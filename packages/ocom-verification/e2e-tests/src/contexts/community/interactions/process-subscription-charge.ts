import { Interaction, the } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf, performBillingAction } from '../abilities/community-portal-page.ts';

export const ClickProcessSubscriptionCharge = () =>
	Interaction.where(the`#actor processes a subscription charge`, async (actor) => {
		const page = communityBrowserPageOf(actor);
		await performBillingAction(page, 'AdminCommunityBillingContainerCommunityProcessSubscriptionCharge', () => billingPageOn(page).clickProcessCharge());
	});
