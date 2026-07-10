import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Actor, notes, Task } from '@serenity-js/core';
import { mockStaffRoleCount } from '../abilities/mock-staff-role-backend.ts';
import type { StaffRoleUiNotes } from '../notes/staff-role-notes.ts';
import { flushUi, formPageFor, listPageFor, OpenEditFormForRole, OpenStaffRolesList, waitUntilUi } from './staff-roles-screen.ts';

/** Details captured from the create staff role form Gherkin table. */
export interface StaffRoleFormInput {
	roleName?: string;
	enterpriseAppRole?: string;
}

/**
 * Task that opens the create staff role form, fills it, and submits it,
 * recording the baseline role count in actor notes for negative-path checks.
 */
export const CreateStaffRoleViaForm = (details: StaffRoleFormInput): Task =>
	Task.where(
		`#actor creates a staff role named "${details.roleName ?? ''}"`,
		new TaskStep<Actor>('#actor fills and submits the create staff role form', async (actor) => {
			await actor.attemptsTo(notes<StaffRoleUiNotes>().set('baselineStaffRoleCount', mockStaffRoleCount()));
			await actor.attemptsTo(OpenStaffRolesList());

			const listPage = listPageFor(actor);
			await listPage.clickCreateRole();

			const formPage = formPageFor(actor);
			await waitUntilUi(() => formPage.roleNameInput.isVisible(), 'Expected the create staff role form to render');
			if (details.roleName) {
				await formPage.fillRoleName(details.roleName);
			}
			if (details.enterpriseAppRole) {
				await formPage.selectEnterpriseAppRole(details.enterpriseAppRole);
			}
			await formPage.clickSubmit();
			await flushUi();
		}),
	);

/**
 * Task that renames a staff role through the edit form.
 */
export const RenameStaffRoleViaForm = (currentName: string, newName: string): Task =>
	Task.where(
		`#actor renames the staff role "${currentName}" to "${newName}"`,
		new TaskStep<Actor>('#actor updates the role name and submits the edit form', async (actor) => {
			await actor.attemptsTo(OpenEditFormForRole(currentName));
			const formPage = formPageFor(actor);
			await formPage.fillRoleName(newName);
			await formPage.clickSubmit();
			await flushUi();
		}),
	);
