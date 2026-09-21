import { Task } from '@serenity-js/core';
import { RenderCommunityBilling } from './community-screen.ts';

export const ViewBillingHistory = (): Task => Task.where('#actor views the billing history', RenderCommunityBilling());
