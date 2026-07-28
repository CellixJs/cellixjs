import { Question } from '@serenity-js/core';
import { currentMockPath } from '../abilities/mock-staff-role-backend.ts';
import { feedbackPage, formPageFor, listPageFor, waitUntilUi } from '../tasks/staff-roles-screen.ts';

/** Question that reads the staff role names visible in the rendered list. */
export const ListedStaffRoleNames = () => Question.about('the listed staff role names', async (actor) => await listPageFor(actor).listedRoleNames());

/** Question that waits for a staff role to appear in the rendered list. */
export const StaffRolesListIncludes = (roleName: string) =>
	Question.about(`whether the staff roles list includes "${roleName}"`, async (actor) => {
		const listPage = listPageFor(actor);
		try {
			await waitUntilUi(() => listPage.hasRoleNamed(roleName), `Expected the staff roles list to include "${roleName}"`);
			return true;
		} catch {
			return false;
		}
	});

/** Question that reads the role name shown by the staff role form. */
export const FormRoleNameValue = () => Question.about('the staff role form role name', async (actor) => await formPageFor(actor).roleNameValue());

/** Question that reads the enterprise app role selected in the staff role form. */
export const FormEnterpriseAppRole = () => Question.about('the staff role form enterprise app role', async (actor) => await formPageFor(actor).selectedEnterpriseAppRole());

/** Question that waits for a success message after a staff-role mutation. */
export const SuccessFeedbackVisible = () =>
	Question.about('whether a staff role success message is visible', async () => {
		try {
			await waitUntilUi(() => feedbackPage().successFeedback.isVisible(), 'Expected a success message');
			return true;
		} catch {
			return false;
		}
	});

/** Question that waits for an error message containing the given fragment. */
export const ErrorFeedbackContaining = (expectedFragment: string) =>
	Question.about(`whether a staff role error containing "${expectedFragment}" is visible`, async () => {
		try {
			await waitUntilUi(async () => {
				const errorFeedback = feedbackPage().errorFeedback;
				if (!(await errorFeedback.isVisible())) {
					return false;
				}
				const text = (await errorFeedback.textContent()) ?? '';
				return text.includes(expectedFragment);
			}, `Expected a staff role error message containing "${expectedFragment}"`);
			return true;
		} catch {
			return false;
		}
	});

/** Question that waits for a form validation error matching the given pattern. */
export const ValidationErrorMatching = (expectedPattern: RegExp) =>
	Question.about(`whether a validation error matching ${expectedPattern} is visible`, async (actor) => {
		const formPage = formPageFor(actor);
		try {
			await waitUntilUi(async () => {
				if (!(await formPage.firstValidationError.isVisible())) {
					return false;
				}
				const text = (await formPage.firstValidationError.textContent()) ?? '';
				return expectedPattern.test(text);
			}, `Expected a validation error matching ${expectedPattern}`);
			return true;
		} catch {
			return false;
		}
	});

/** Question that answers whether the create staff role action is visible. */
export const CreateRoleActionVisible = () => Question.about('whether the create staff role action is visible', async (actor) => await listPageFor(actor).createRoleButton.isVisible());

/** Question that answers whether any staff role edit action is visible. */
export const AnyEditActionVisible = () => Question.about('whether any staff role edit action is visible', async (actor) => await listPageFor(actor).hasAnyEditAction());

/** Question that answers whether the delete action is visible on the details screen. */
export const DeleteActionVisible = () => Question.about('whether the staff role delete action is visible', async (actor) => await formPageFor(actor).hasDeleteAction());

/** Question that reads the text of the currently open delete confirmation. */
export const DeleteConfirmationText = () =>
	Question.about('the staff role delete confirmation text', async (actor) => {
		const formPage = formPageFor(actor);
		await waitUntilUi(() => formPage.deleteConfirmation.isVisible(), 'Expected the delete confirmation to be visible');
		return await formPage.deleteConfirmationText();
	});

/** Question that waits for navigation back to the rendered staff-role list. */
export const StaffRolesListVisible = () =>
	Question.about('whether the staff roles list route and heading are visible', async (actor) => {
		const listPage = listPageFor(actor);
		try {
			await waitUntilUi(async () => currentMockPath() === '/' && (await listPage.heading.isVisible()), 'Expected navigation back to the staff roles list');
			return true;
		} catch {
			return false;
		}
	});

/** Question that waits for a staff role to disappear from the rendered list. */
export const StaffRolesListExcludes = (roleName: string) =>
	Question.about(`whether the staff roles list no longer includes "${roleName}"`, async (actor) => {
		const listPage = listPageFor(actor);
		try {
			await waitUntilUi(async () => currentMockPath() === '/' && (await listPage.heading.isVisible()) && !(await listPage.hasRoleNamed(roleName)), `Expected the staff roles list to be visible and no longer include "${roleName}"`);
			return true;
		} catch {
			return false;
		}
	});
