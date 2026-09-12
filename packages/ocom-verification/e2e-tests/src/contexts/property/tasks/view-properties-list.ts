import { Task, the } from '@serenity-js/core';
import { OpenPropertiesList } from '../interactions/open-properties-list.ts';

/**
 * Task that opens the admin properties list of the managed community.
 */
export const ViewPropertiesList = () => Task.where(the`#actor views the properties list`, OpenPropertiesList());
