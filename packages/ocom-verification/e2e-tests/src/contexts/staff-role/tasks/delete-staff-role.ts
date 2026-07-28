import { Task, the } from '@serenity-js/core';
import { CancelDeleteStaffRole, ClickDeleteStaffRole, ConfirmDeleteStaffRole } from '../interactions/delete-staff-role-actions.ts';
import { OpenEditStaffRoleForm } from '../interactions/open-edit-staff-role-form.ts';

/**
 * Task that deletes a staff role through the details screen: opens the role,
 * clicks the delete action, and confirms the Popconfirm.
 */
export const DeleteStaffRoleViaForm = (roleName: string) => Task.where(the`#actor deletes the staff role "${roleName}" via the staff portal`, OpenEditStaffRoleForm(roleName), ClickDeleteStaffRole(), ConfirmDeleteStaffRole());

/**
 * Task that opens the details screen of a staff role and clicks the delete
 * action, leaving the confirmation Popconfirm open.
 */
export const StartDeletingStaffRole = (roleName: string) => Task.where(the`#actor starts deleting the staff role "${roleName}"`, OpenEditStaffRoleForm(roleName), ClickDeleteStaffRole());

/**
 * Task that cancels the currently open staff role delete confirmation.
 */
export const CancelStaffRoleDeletion = () => Task.where(the`#actor cancels the staff role deletion`, CancelDeleteStaffRole());
