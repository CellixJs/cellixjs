import { Task, the } from '@serenity-js/core';
import { OpenBillingSettings } from '../interactions/open-billing-settings.ts';

export const ViewCurrentSubscription = () => Task.where(the`#actor views the current subscription`, OpenBillingSettings());
