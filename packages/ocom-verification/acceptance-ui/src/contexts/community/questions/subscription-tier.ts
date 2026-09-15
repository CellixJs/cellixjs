import { Question } from '@serenity-js/core';
import { billingPageFor } from '../tasks/community-screen.ts';

export const SubscriptionTier = () => Question.about('the current subscription tier', async (actor) => (await billingPageFor(actor).displayedTier()).trim());
