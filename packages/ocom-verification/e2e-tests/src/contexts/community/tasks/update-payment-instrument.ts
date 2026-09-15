import type { CommunityPaymentInstrumentFields } from '@ocom-verification/verification-shared/pages';
import { Task, the } from '@serenity-js/core';
import { FillPaymentInstrument } from '../interactions/fill-payment-instrument.ts';
import { OpenBillingSettings } from '../interactions/open-billing-settings.ts';
import { SaveSubscriptionPlan } from '../interactions/save-subscription-plan.ts';

export const UpdatePaymentInstrument = (fields: CommunityPaymentInstrumentFields) => Task.where(the`#actor updates the community payment instrument`, OpenBillingSettings(), FillPaymentInstrument(fields), SaveSubscriptionPlan());
