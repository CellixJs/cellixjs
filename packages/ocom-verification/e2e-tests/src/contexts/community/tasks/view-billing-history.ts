import { Task, the } from '@serenity-js/core';
import { OpenBillingSettings } from '../interactions/open-billing-settings.ts';

export const ViewBillingHistory = () => Task.where(the`#actor views the billing history`, OpenBillingSettings());
