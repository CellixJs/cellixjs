import { Task, the } from '@serenity-js/core';
import { FillStaffRoleForm, GrantFormPermission } from '../interactions/fill-staff-role-form.ts';
import { OpenCreateStaffRoleForm } from '../interactions/open-create-staff-role-form.ts';
import { OpenStaffRolesList } from '../interactions/open-staff-roles-list.ts';
import { RecordBaselineStaffRoleCount } from '../interactions/record-staff-role-notes.ts';
import { SubmitStaffRoleForm } from '../interactions/submit-staff-role-form.ts';

export const DEFAULT_ENTERPRISE_APP_ROLE = 'Staff.CaseManager';

/**
 * Task that opens the create staff role form, fills it, and submits it,
 * recording the baseline role count in actor notes for negative-path checks.
 */
export const CreateStaffRoleViaForm = (fields: Record<string, string>) =>
	Task.where(
		the`#actor creates a staff role named "${fields['roleName'] ?? ''}" via the staff portal`,
		OpenStaffRolesList(),
		RecordBaselineStaffRoleCount(),
		OpenCreateStaffRoleForm(),
		FillStaffRoleForm(fields),
		SubmitStaffRoleForm(),
	);

/**
 * Task that creates a staff role and grants the given permissions before submitting.
 */
export const CreateStaffRoleWithPermissions = (roleName: string, permissionKeys: string[]) =>
	Task.where(
		the`#actor creates a staff role named "${roleName}" with permissions via the staff portal`,
		OpenStaffRolesList(),
		OpenCreateStaffRoleForm(),
		FillStaffRoleForm({ roleName, enterpriseAppRole: DEFAULT_ENTERPRISE_APP_ROLE }),
		...permissionKeys.map((permissionKey) => GrantFormPermission(permissionKey)),
		SubmitStaffRoleForm(),
	);
