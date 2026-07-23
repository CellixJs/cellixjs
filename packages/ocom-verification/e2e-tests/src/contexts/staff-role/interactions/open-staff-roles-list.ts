import { Interaction, the } from '@serenity-js/core';
import { openRolesList, staffPortalPageOf } from '../abilities/staff-portal-page.ts';

/**
 * Low-level interaction that navigates the actor's staff portal to the staff
 * roles list and waits for the table rows to render.
 */
export const OpenStaffRolesList = () =>
	Interaction.where(the`#actor opens the staff roles list`, async (actor) => {
		const page = await staffPortalPageOf(actor);
		await openRolesList(page);
	});
