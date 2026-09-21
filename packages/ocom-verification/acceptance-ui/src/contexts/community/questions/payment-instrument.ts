import { Question } from '@serenity-js/core';
import { billingPageFor } from '../tasks/community-screen.ts';

export const PaymentInstrumentDisplay = () => Question.about('the payment instrument display', async (actor) => billingPageFor(actor).displayedPaymentInstrument());
