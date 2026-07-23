import { type Actor, Interaction, the } from '@serenity-js/core';
import { listPageOn, openRolesList, staffPortalPageOf, waitForReturnToRolesList, waitUntil } from '../abilities/staff-portal-page.ts';
import { FillStaffRoleForm } from '../interactions/fill-staff-role-form.ts';
import { OpenCreateStaffRoleForm } from '../interactions/open-create-staff-role-form.ts';
import { SubmitStaffRoleForm } from '../interactions/submit-staff-role-form.ts';
import { DEFAULT_ENTERPRISE_APP_ROLE } from './create-staff-role.ts';

/**
 * Given-glue task that makes sure a staff role exists, creating it through the
 * staff portal UI when absent. Conditional, so it is modelled as a single
 * interaction that composes the create-form interactions only when needed.
 */
export const EnsureStaffRoleExists = (roleName: string) =>
	Interaction.where(the`#actor makes sure a staff role named "${roleName}" exists`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await staffPortalPageOf(actor);
		const listPage = await openRolesList(page);
		if (await listPage.hasRoleNamed(roleName)) {
			return;
		}
		await actor.attemptsTo(OpenCreateStaffRoleForm(), FillStaffRoleForm({ roleName, enterpriseAppRole: DEFAULT_ENTERPRISE_APP_ROLE }), SubmitStaffRoleForm());
		await waitForReturnToRolesList(page, `Creating the prerequisite staff role "${roleName}" did not return to the roles list`);
		await waitUntil(async () => await listPageOn(page).hasRoleNamed(roleName), `Prerequisite staff role "${roleName}" did not appear in the roles list`);
	});
