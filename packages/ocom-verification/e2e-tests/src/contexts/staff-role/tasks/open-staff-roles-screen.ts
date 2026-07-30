import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { StaffE2ENotes } from '../../staff/abilities/staff-types.ts';
import { isAtRolesList, ROLES_LIST_PATH, staffPortalPageOf } from '../abilities/staff-portal-page.ts';

/**
 * Task that navigates to the staff roles screen and records where the router
 * settled, so authorization redirects can be asserted.
 */
export const OpenStaffRolesScreenRecordingPath = () =>
	Interaction.where(the`#actor opens the staff roles screen`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await staffPortalPageOf(actor);
		await page.goto(ROLES_LIST_PATH, { waitUntil: 'networkidle' });
		await page.waitForURL((url) => url.pathname === '/unauthorized' || isAtRolesList(url), { timeout: 20_000 });
		await actor.attemptsTo(notes<StaffE2ENotes>().set('currentPath', new URL(page.url()).pathname));
	});
