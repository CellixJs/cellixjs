import { Interaction, Task, the } from '@serenity-js/core';
import { formPageOn, staffPortalPageOf, waitUntil } from '../abilities/staff-portal-page.ts';
import { openUserDetailFor, userDetailPageOn } from '../abilities/staff-user-page.ts';

/**
 * Low-level interaction that opens the detail screen of a staff user from the
 * staff users list.
 */
const OpenStaffUserDetail = (displayName: string) =>
	Interaction.where(the`#actor opens the staff user detail of "${displayName}"`, async (actor) => {
		const page = await staffPortalPageOf(actor);
		await openUserDetailFor(page, displayName);
	});

/**
 * Low-level interaction that picks a role in the assigned-role select of the
 * staff user detail screen currently on screen.
 */
const SelectAssignedStaffRole = (roleName: string) =>
	Interaction.where(the`#actor selects the assigned staff role "${roleName}"`, async (actor) => {
		const page = await staffPortalPageOf(actor);
		await userDetailPageOn(page).selectRole(roleName);
	});

/**
 * Low-level interaction that saves the assigned-role selection and waits for
 * the success feedback.
 */
const SaveAssignedStaffRole = () =>
	Interaction.where(the`#actor saves the assigned staff role`, async (actor) => {
		const page = await staffPortalPageOf(actor);
		await userDetailPageOn(page).clickSave();
		const feedback = formPageOn(page);
		await waitUntil(() => feedback.successFeedback.isVisible(), 'Expected a success message after assigning the staff role');
	});

/**
 * Task that assigns a staff role to a staff user through the staff user
 * detail screen.
 */
export const AssignStaffRoleToUserViaDetail = (roleName: string, staffUserDisplayName: string) =>
	Task.where(
		the`#actor assigns the staff role "${roleName}" to the staff user "${staffUserDisplayName}" via the staff portal`,
		OpenStaffUserDetail(staffUserDisplayName),
		SelectAssignedStaffRole(roleName),
		SaveAssignedStaffRole(),
	);
