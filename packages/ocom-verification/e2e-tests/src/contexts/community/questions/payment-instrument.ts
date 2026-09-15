import { Question } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf } from '../abilities/community-portal-page.ts';

export const PaymentInstrumentDisplay = () => Question.about('the payment instrument display', async (actor) => billingPageOn(communityBrowserPageOf(actor)).displayedPaymentInstrument());
