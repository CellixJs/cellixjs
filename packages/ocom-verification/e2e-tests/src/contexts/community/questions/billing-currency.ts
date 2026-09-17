import { Question } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf } from '../abilities/community-portal-page.ts';

export const BillingCurrency = () => Question.about('the billing currency', async (actor) => (await billingPageOn(communityBrowserPageOf(actor)).displayedCurrency()).trim());
