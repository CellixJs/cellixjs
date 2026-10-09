import { Task, the } from '@serenity-js/core';
import { OpenCommunitySettings } from '../interactions/open-community-settings.ts';
import { ReadCommunitySettings } from '../interactions/read-community-settings.ts';

/**
 * Task that opens the admin settings screen and records the displayed
 * community details for follow-up assertions.
 */
export const ViewCommunitySettings = () => Task.where(the`#actor views the community settings via the admin screen`, OpenCommunitySettings(), ReadCommunitySettings());
