import { Task, the } from '@serenity-js/core';
import { OpenStaffRolesList } from '../interactions/open-staff-roles-list.ts';
import { RecordListedStaffRoleNames } from '../interactions/record-staff-role-notes.ts';

/**
 * Task that opens the staff roles list in the browser and records the listed
 * role names in actor notes.
 */
export const ViewStaffRolesList = () => Task.where(the`#actor views the staff roles list`, OpenStaffRolesList(), RecordListedStaffRoleNames());
