import { Task, the } from '@serenity-js/core';
import { FillStaffRoleForm } from '../interactions/fill-staff-role-form.ts';
import { OpenEditStaffRoleForm } from '../interactions/open-edit-staff-role-form.ts';
import { SubmitStaffRoleForm } from '../interactions/submit-staff-role-form.ts';

/**
 * Task that renames a staff role through the edit form.
 */
export const RenameStaffRoleViaForm = (currentName: string, newName: string) =>
	Task.where(the`#actor renames the staff role "${currentName}" to "${newName}" via the staff portal`, OpenEditStaffRoleForm(currentName), FillStaffRoleForm({ roleName: newName }), SubmitStaffRoleForm());
