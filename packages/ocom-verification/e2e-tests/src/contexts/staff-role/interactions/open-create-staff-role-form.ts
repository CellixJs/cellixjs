import { Interaction, the } from '@serenity-js/core';
import { formPageOn, listPageOn, staffPortalPageOf } from '../abilities/staff-portal-page.ts';

/**
 * Low-level interaction that opens the create staff role form from the roles
 * list and waits for the form to be ready. Expects the roles list to be open.
 */
export const OpenCreateStaffRoleForm = () =>
	Interaction.where(the`#actor opens the create staff role form`, async (actor) => {
		const page = await staffPortalPageOf(actor);
		await listPageOn(page).clickCreateRole();
		await page.waitForURL((url) => url.pathname.endsWith('/staff-roles/create'), { timeout: 20_000 });
		await formPageOn(page).roleNameInput.waitFor({ state: 'visible', timeout: 20_000 });
	});
