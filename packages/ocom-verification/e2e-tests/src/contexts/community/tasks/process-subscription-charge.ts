import { Task, the } from '@serenity-js/core';
import { CapturePageBillingError } from '../interactions/capture-billing-error.ts';
import { OpenBillingSettings } from '../interactions/open-billing-settings.ts';
import { ClickProcessSubscriptionCharge } from '../interactions/process-subscription-charge.ts';

export const ProcessSubscriptionCharge = () => Task.where(the`#actor processes a subscription charge`, OpenBillingSettings(), ClickProcessSubscriptionCharge(), CapturePageBillingError());
