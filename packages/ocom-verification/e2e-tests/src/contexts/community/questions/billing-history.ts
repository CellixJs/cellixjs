import { Question } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf } from '../abilities/community-portal-page.ts';

export const BillingHistoryText = () => Question.about('the billing history text', async (actor) => billingPageOn(communityBrowserPageOf(actor)).historyText());
