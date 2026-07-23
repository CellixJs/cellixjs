import { Task, the } from '@serenity-js/core';
import { GrantFormPermission } from '../interactions/fill-staff-role-form.ts';
import { OpenEditStaffRoleForm } from '../interactions/open-edit-staff-role-form.ts';
import { SubmitStaffRoleForm } from '../interactions/submit-staff-role-form.ts';

/**
 * Task that grants a permission to a staff role through the edit form.
 */
export const GrantStaffRolePermissionViaForm = (permissionKey: string, roleName: string) =>
	Task.where(the`#actor grants the permission "${permissionKey}" to the staff role "${roleName}" via the staff portal`, OpenEditStaffRoleForm(roleName), GrantFormPermission(permissionKey), SubmitStaffRoleForm());
