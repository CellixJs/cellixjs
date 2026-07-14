import { Interaction, the } from '@serenity-js/core';
import { formPageOn, staffPortalPageOf } from '../abilities/staff-portal-page.ts';

/**
 * Low-level interaction that fills the staff role form fields currently on
 * screen. Only the provided fields are touched, so it works for both the
 * create form and the edit form.
 */
export const FillStaffRoleForm = (fields: Record<string, string>) =>
	Interaction.where(the`#actor fills the staff role form`, async (actor) => {
		const page = await staffPortalPageOf(actor);
		const formPage = formPageOn(page);
		if (fields['roleName'] !== undefined) {
			await formPage.fillRoleName(fields['roleName']);
		}
		const enterpriseAppRole = fields['enterpriseAppRole'];
		if (enterpriseAppRole) {
			await formPage.selectEnterpriseAppRole(enterpriseAppRole);
		}
	});

/**
 * Low-level interaction that grants a single permission on the staff role
 * form currently on screen.
 */
export const GrantFormPermission = (permissionKey: string) =>
	Interaction.where(the`#actor grants the "${permissionKey}" permission on the staff role form`, async (actor) => {
		const page = await staffPortalPageOf(actor);
		await formPageOn(page).grantPermission(permissionKey);
	});
