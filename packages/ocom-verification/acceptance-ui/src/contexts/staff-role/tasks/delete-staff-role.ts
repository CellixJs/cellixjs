import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Actor, Task } from '@serenity-js/core';
import { flushUi, formPageFor, OpenEditFormForRole, waitUntilUi } from './staff-roles-screen.ts';

/**
 * Task that opens the details (edit) screen of a staff role and clicks the
 * delete action, leaving the confirmation Popconfirm open.
 */
export const StartDeletingStaffRole = (roleName: string): Task =>
	Task.where(
		`#actor starts deleting the staff role "${roleName}"`,
		new TaskStep<Actor>(`#actor opens the delete confirmation for "${roleName}"`, async (actor) => {
			await actor.attemptsTo(OpenEditFormForRole(roleName));
			const formPage = formPageFor(actor);
			await waitUntilUi(() => formPage.deleteRoleButton.isVisible(), `Expected a delete action for the staff role "${roleName}"`);
			await formPage.clickDeleteRole();
			await flushUi();
			await waitUntilUi(() => formPage.deleteConfirmation.isVisible(), 'Expected the delete confirmation to appear');
		}),
	);

/**
 * Task that confirms the currently open delete confirmation.
 */
const ConfirmStaffRoleDeletion = (): Task =>
	Task.where(
		'#actor confirms the staff role deletion',
		new TaskStep<Actor>('#actor accepts the delete confirmation', async (actor) => {
			const formPage = formPageFor(actor);
			await formPage.confirmDelete();
			await flushUi();
		}),
	);

/**
 * Task that cancels the currently open delete confirmation.
 */
export const CancelStaffRoleDeletion = (): Task =>
	Task.where(
		'#actor cancels the staff role deletion',
		new TaskStep<Actor>('#actor dismisses the delete confirmation', async (actor) => {
			const formPage = formPageFor(actor);
			await formPage.cancelDelete();
			await flushUi();
		}),
	);

/**
 * Task that deletes a staff role through the details screen: opens the role,
 * clicks the delete action, and confirms the Popconfirm.
 */
export const DeleteStaffRoleViaForm = (roleName: string): Task =>
	Task.where(
		`#actor deletes the staff role "${roleName}"`,
		new TaskStep<Actor>(`#actor deletes "${roleName}" via the details screen`, async (actor) => {
			await actor.attemptsTo(StartDeletingStaffRole(roleName));
			await actor.attemptsTo(ConfirmStaffRoleDeletion());
		}),
	);
