import { Interaction, the } from '@serenity-js/core';
import { openEditFormFor, staffPortalPageOf } from '../abilities/staff-portal-page.ts';

/**
 * Low-level interaction that opens the edit form for a staff role from the
 * roles list and waits for its values to load.
 */
export const OpenEditStaffRoleForm = (roleName: string) =>
	Interaction.where(the`#actor opens the edit form for the staff role "${roleName}"`, async (actor) => {
		const page = await staffPortalPageOf(actor);
		await openEditFormFor(page, roleName);
	});
