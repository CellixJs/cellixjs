import { Task, the } from '@serenity-js/core';
import { type CommunitySettingsFormDetails, FillCommunitySettingsForm } from '../interactions/fill-community-settings-form.ts';
import { OpenCommunitySettings } from '../interactions/open-community-settings.ts';
import { SubmitCommunitySettingsForm } from '../interactions/submit-community-settings-form.ts';

export type { CommunitySettingsFormDetails };

/**
 * Task that updates the community settings through the admin settings screen.
 */
export const UpdateCommunitySettings = (details: CommunitySettingsFormDetails) =>
	Task.where(the`#actor updates the community settings (${Object.keys(details).join(', ')}) via the admin screen`, OpenCommunitySettings(), FillCommunitySettingsForm(details), SubmitCommunitySettingsForm());
