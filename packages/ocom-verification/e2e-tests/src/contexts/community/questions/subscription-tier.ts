import { Question } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf } from '../abilities/community-portal-page.ts';

export const SubscriptionTier = () => Question.about('the current subscription tier', async (actor) => (await billingPageOn(communityBrowserPageOf(actor)).displayedTier()).trim());
