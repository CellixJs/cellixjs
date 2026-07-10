import { type Actor, notes, Question } from '@serenity-js/core';
import type { StaffRoleE2ENotes } from '../notes/staff-role-notes.ts';
import { formPageOn, openEditFormFor, openRolesList, staffPortalPageOf, waitForReturnToRolesList, waitUntil } from '../tasks/staff-roles-screen.ts';

/** Staff role names recorded when the actor last viewed the roles list. */
export const RecordedStaffRoleNames = () =>
	Question.about('the staff role names recorded from the roles list', async (actor) => {
		try {
			return await (actor as unknown as Actor).answer(notes<StaffRoleE2ENotes>().get('listedStaffRoleNames'));
		} catch {
			throw new Error('No staff roles list was retrieved. Did the actor view the staff roles list first?');
		}
	});

/** Waits until the live roles list includes the given role name. */
export const StaffRolesListIncludes = (roleName: string) =>
	Question.about(`whether the staff roles list includes "${roleName}"`, async (actor) => {
		const page = await staffPortalPageOf(actor as unknown as Actor);
		const listPage = await openRolesList(page);
		await waitUntil(async () => await listPage.hasRoleNamed(roleName), `Expected staff roles list to include "${roleName}", but got: [${(await listPage.listedRoleNames()).join(', ')}]`);
		return true;
	});

/** Waits for the app to navigate back to the staff roles list after a mutation. */
export const ReturnedToStaffRolesList = (failureMessage: string) =>
	Question.about('whether the app returned to the staff roles list', async (actor) => {
		const page = await staffPortalPageOf(actor as unknown as Actor);
		await waitForReturnToRolesList(page, failureMessage);
		return true;
	});

/** Whether the edit form for a role shows the given permission as granted. */
export const StaffRolePermissionGranted = (roleName: string, permissionKey: string) =>
	Question.about(`whether the staff role "${roleName}" has the permission "${permissionKey}" granted`, async (actor) => {
		const page = await staffPortalPageOf(actor as unknown as Actor);
		const formPage = await openEditFormFor(page, roleName);
		return await formPage.isPermissionGranted(permissionKey);
	});

/** Waits for an error feedback message containing the given fragment. */
export const StaffRoleErrorContaining = (expectedFragment: string) =>
	Question.about(`whether a staff role error containing "${expectedFragment}" is shown`, async (actor) => {
		const page = await staffPortalPageOf(actor as unknown as Actor);
		const formPage = formPageOn(page);
		await waitUntil(async () => {
			if (!(await formPage.errorFeedback.isVisible())) {
				return false;
			}
			const text = (await formPage.errorFeedback.textContent()) ?? '';
			return text.includes(expectedFragment);
		}, `Expected a staff role error message containing "${expectedFragment}"`);
		return true;
	});

/** Waits for a validation error matching the given field name. */
export const StaffRoleValidationErrorFor = (fieldName: string) =>
	Question.about(`whether a staff role validation error for "${fieldName}" is shown`, async (actor) => {
		const page = await staffPortalPageOf(actor as unknown as Actor);
		const formPage = formPageOn(page);
		const expectedPattern = fieldName === 'roleName' ? /role name/i : new RegExp(fieldName, 'i');
		await waitUntil(async () => {
			if (!(await formPage.firstValidationError.isVisible())) {
				return false;
			}
			const text = (await formPage.firstValidationError.textContent()) ?? '';
			return expectedPattern.test(text);
		}, `Expected a validation error for "${fieldName}"`);
		return true;
	});

/** Current number of staff roles shown in the live roles list. */
export const CurrentStaffRoleCount = () =>
	Question.about('the current staff role count', async (actor) => {
		const page = await staffPortalPageOf(actor as unknown as Actor);
		const listPage = await openRolesList(page);
		return (await listPage.listedRoleNames()).length;
	});

/** Baseline staff role count recorded before an attempted creation. */
export const BaselineStaffRoleCount = () =>
	Question.about('the baseline staff role count', async (actor) => {
		try {
			return await (actor as unknown as Actor).answer(notes<StaffRoleE2ENotes>().get('baselineStaffRoleCount'));
		} catch {
			throw new Error('No baseline staff role count was recorded. Did the actor attempt to create a staff role first?');
		}
	});
