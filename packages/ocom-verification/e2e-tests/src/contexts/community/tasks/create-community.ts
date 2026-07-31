import { Task, the } from '@serenity-js/core';
import { FillCommunityForm } from '../interactions/fill-community-form.ts';
import { OpenCreateCommunityForm } from '../interactions/open-create-community-form.ts';
import { SubmitCommunityForm } from '../interactions/submit-community-form.ts';

/**
 * Task that creates a community through the browser UI.
 */
export const CreateCommunity = (name: string) => Task.where(the`#actor creates community "${name}" via UI`, OpenCreateCommunityForm(), FillCommunityForm(name), SubmitCommunityForm(name));
