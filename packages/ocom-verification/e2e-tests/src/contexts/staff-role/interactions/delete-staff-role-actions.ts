import { Interaction, the } from '@serenity-js/core';
import { formPageOn, staffPortalPageOf, waitUntil } from '../abilities/staff-portal-page.ts';

/**
 * Low-level interaction that clicks the delete action on the staff role
 * details (edit) screen, leaving the confirmation Popconfirm open.
 */
export const ClickDeleteStaffRole = () =>
	Interaction.where(the`#actor clicks the delete staff role action`, async (actor) => {
		const page = await staffPortalPageOf(actor);
		const formPage = formPageOn(page);
		await waitUntil(() => formPage.deleteRoleButton.isVisible(), 'Expected a delete action on the staff role details screen');
		await formPage.clickDeleteRole();
		await waitUntil(() => formPage.deleteConfirmation.isVisible(), 'Expected the delete confirmation to appear');
	});

/**
 * Low-level interaction that accepts the currently open delete confirmation.
 */
export const ConfirmDeleteStaffRole = () =>
	Interaction.where(the`#actor confirms the staff role deletion`, async (actor) => {
		const page = await staffPortalPageOf(actor);
		await formPageOn(page).confirmDelete();
	});

/**
 * Low-level interaction that dismisses the currently open delete confirmation.
 */
export const CancelDeleteStaffRole = () =>
	Interaction.where(the`#actor cancels the staff role deletion`, async (actor) => {
		const page = await staffPortalPageOf(actor);
		await formPageOn(page).cancelDelete();
	});
