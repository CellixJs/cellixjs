import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { StaffE2ENotes } from '../../staff/abilities/staff-types.ts';
import { isAtRolesList, listPageOn, ROLES_LIST_PATH, staffPortalPageOf, waitUntil } from '../abilities/staff-portal-page.ts';

/**
 * Task that navigates to the staff roles screen and records where the router
 * settled, so authorization redirects can be asserted.
 *
 * Do not treat the roles-list pathname alone as settled — after
 * `domcontentloaded` the SPA may still redirect to `/unauthorized` once
 * permissions load. Accept unauthorized immediately, or roles only once the
 * list heading is visible.
 */
export const OpenStaffRolesScreenRecordingPath = () =>
	Interaction.where(the`#actor opens the staff roles screen`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await staffPortalPageOf(actor);
		await page.goto(ROLES_LIST_PATH, { waitUntil: 'domcontentloaded', timeout: 30_000 });
		await waitUntil(
			async () => {
				const { pathname } = new URL(page.url());
				if (pathname === '/unauthorized') {
					return true;
				}
				if (!isAtRolesList(new URL(page.url()))) {
					return false;
				}
				return await listPageOn(page)
					.heading.isVisible()
					.catch(() => false);
			},
			() => `Timed out waiting for unauthorized redirect or staff roles list (still on ${new URL(page.url()).pathname})`,
		);
		await actor.attemptsTo(notes<StaffE2ENotes>().set('currentPath', new URL(page.url()).pathname));
	});
