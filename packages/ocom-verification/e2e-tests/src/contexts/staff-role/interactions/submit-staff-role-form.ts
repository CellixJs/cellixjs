import { Interaction, the } from '@serenity-js/core';
import { formPageOn, staffPortalPageOf } from '../abilities/staff-portal-page.ts';

/**
 * Low-level interaction that submits the staff role form currently on screen.
 */
export const SubmitStaffRoleForm = () =>
	Interaction.where(the`#actor submits the staff role form`, async (actor) => {
		const page = await staffPortalPageOf(actor);
		await formPageOn(page).clickSubmit();
	});
