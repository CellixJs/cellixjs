import { Task } from '@serenity-js/core';
import { RenderCommunityBilling } from './community-screen.ts';

export const ViewCurrentSubscription = (): Task => Task.where('#actor views the current subscription', RenderCommunityBilling());
