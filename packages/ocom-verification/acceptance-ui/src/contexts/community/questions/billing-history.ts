import { Question } from '@serenity-js/core';
import { billingPageFor } from '../tasks/community-screen.ts';

export const BillingHistoryText = () => Question.about('the billing history text', async (actor) => billingPageFor(actor).historyText());
