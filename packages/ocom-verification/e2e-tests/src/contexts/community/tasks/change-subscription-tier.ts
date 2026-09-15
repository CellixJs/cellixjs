import { Task, the } from '@serenity-js/core';
import { OpenBillingSettings } from '../interactions/open-billing-settings.ts';
import { RecordBillingBaseline } from '../interactions/record-billing-baseline.ts';
import { SaveSubscriptionPlan } from '../interactions/save-subscription-plan.ts';
import { SelectSubscriptionPlan } from '../interactions/select-subscription-plan.ts';

export const ChangeSubscriptionTier = (plan: string) => Task.where(the`#actor changes the subscription plan to "${plan}"`, OpenBillingSettings(), RecordBillingBaseline(), SelectSubscriptionPlan(plan), SaveSubscriptionPlan());
