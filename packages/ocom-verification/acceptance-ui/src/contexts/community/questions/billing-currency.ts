import { Question } from '@serenity-js/core';
import { billingPageFor } from '../tasks/community-screen.ts';

export const BillingCurrency = () => Question.about('the billing currency', async (actor) => (await billingPageFor(actor).displayedCurrency()).trim());
