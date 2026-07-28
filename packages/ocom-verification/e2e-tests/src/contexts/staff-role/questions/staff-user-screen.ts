import { type Actor, Question } from '@serenity-js/core';
import { staffPortalPageOf } from '../abilities/staff-portal-page.ts';
import { openUserDetailFor } from '../abilities/staff-user-page.ts';

/**
 * Question that reads the role currently assigned to a staff user, polling
 * with fresh page loads until the expected role shows up (staff-role deletion
 * reassigns users asynchronously after the delete mutation commits).
 */
export const StaffUserAssignedRole = (displayName: string, expectedRoleName: string) =>
	Question.about(`the staff role assigned to "${displayName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await staffPortalPageOf(actor);
		const deadline = Date.now() + 30_000;
		let lastSeenRoleName = '';
		while (Date.now() < deadline) {
			const detailPage = await openUserDetailFor(page, displayName);
			lastSeenRoleName = await detailPage.displayedRoleName();
			if (lastSeenRoleName === expectedRoleName) {
				return lastSeenRoleName;
			}
			await new Promise((resolve) => setTimeout(resolve, 1_000));
		}
		return lastSeenRoleName;
	});
