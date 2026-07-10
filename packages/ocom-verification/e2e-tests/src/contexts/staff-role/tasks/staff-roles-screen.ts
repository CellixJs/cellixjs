import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { StaffRoleFormPage, StaffRolesListPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { Page } from 'playwright';
import { type StaffPortalBusinessRole, staffPortalPageFor } from '../../../shared/abilities/staff-portal-session.ts';
import type { StaffE2ENotes } from '../../staff/abilities/staff-types.ts';
import type { StaffRoleE2ENotes } from '../notes/staff-role-notes.ts';

const ROLES_LIST_PATH = '/staff/user-management/staff-roles';
const DEFAULT_ENTERPRISE_APP_ROLE = 'Staff.CaseManager';

/** Poll a browser condition until it holds or the timeout elapses. */
export const waitUntil = async (condition: () => Promise<boolean>, failureMessage: string, timeoutMs = 20_000): Promise<void> => {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (await condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(failureMessage);
};

/** Resolve the authenticated staff-portal page for the actor's business role. */
export const staffPortalPageOf = async (actor: Actor): Promise<Page> => {
	let role: StaffPortalBusinessRole = 'case manager';
	try {
		role = (await actor.answer(notes<StaffE2ENotes>().get('businessRole'))) ?? 'case manager';
	} catch {
		// No business role noted yet; fall back to the default staff user.
	}
	return await staffPortalPageFor(role);
};

const listPageOn = (page: Page): StaffRolesListPage => new StaffRolesListPage(new PlaywrightPageAdapter(page));

export const formPageOn = (page: Page): StaffRoleFormPage => new StaffRoleFormPage(new PlaywrightPageAdapter(page));

const isAtRolesList = (url: URL): boolean => url.pathname.endsWith('/staff-roles');

/** Navigate to the staff roles list and wait for the table rows to render. */
export const openRolesList = async (page: Page): Promise<StaffRolesListPage> => {
	await page.goto(ROLES_LIST_PATH, { waitUntil: 'networkidle' });
	const listPage = listPageOn(page);
	await waitUntil(async () => (await listPage.listedRoleNames()).length > 0, 'Timed out waiting for the staff roles list to render');
	return listPage;
};

/** Open the create form from the roles list. */
const openCreateForm = async (page: Page): Promise<StaffRoleFormPage> => {
	const listPage = await openRolesList(page);
	await listPage.clickCreateRole();
	await page.waitForURL((url) => url.pathname.endsWith('/staff-roles/create'), { timeout: 20_000 });
	const formPage = formPageOn(page);
	await formPage.roleNameInput.waitFor({ state: 'visible', timeout: 20_000 });
	return formPage;
};

/** Open the edit form for a role and wait for its values to load. */
export const openEditFormFor = async (page: Page, roleName: string): Promise<StaffRoleFormPage> => {
	const listPage = await openRolesList(page);
	await listPage.clickEditForRole(roleName);
	await page.waitForURL((url) => url.pathname.includes('/staff-roles/edit/'), { timeout: 20_000 });
	const formPage = formPageOn(page);
	await waitUntil(async () => (await formPage.roleNameValue()) === roleName, `Timed out waiting for the edit form of staff role "${roleName}" to load`);
	return formPage;
};

const fillCreateForm = async (formPage: StaffRoleFormPage, fields: Record<string, string>): Promise<void> => {
	await formPage.fillRoleName(fields['roleName'] ?? '');
	const enterpriseAppRole = fields['enterpriseAppRole'];
	if (enterpriseAppRole) {
		await formPage.selectEnterpriseAppRole(enterpriseAppRole);
	}
};

/** Wait for the app to navigate back to the staff roles list. */
export const waitForReturnToRolesList = async (page: Page, failureMessage: string): Promise<void> => {
	await page.waitForURL(isAtRolesList, { timeout: 20_000 }).catch(() => {
		throw new Error(`${failureMessage} (still on ${new URL(page.url()).pathname})`);
	});
};

/**
 * Task that opens the staff roles list in the browser and records the listed
 * role names in actor notes.
 */
export const ViewStaffRolesList = () =>
	Interaction.where(the`#actor views the staff roles list`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await staffPortalPageOf(actor);
		const listPage = await openRolesList(page);
		await actor.attemptsTo(notes<StaffRoleE2ENotes>().set('listedStaffRoleNames', await listPage.listedRoleNames()));
	});

/**
 * Given-glue task that makes sure a staff role exists, creating it through the
 * staff portal UI when absent.
 */
export const EnsureStaffRoleExists = (roleName: string) =>
	Interaction.where(the`#actor makes sure a staff role named "${roleName}" exists`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await staffPortalPageOf(actor);
		const listPage = await openRolesList(page);
		if (await listPage.hasRoleNamed(roleName)) {
			return;
		}
		const formPage = await openCreateForm(page);
		await fillCreateForm(formPage, { roleName, enterpriseAppRole: DEFAULT_ENTERPRISE_APP_ROLE });
		await formPage.clickSubmit();
		await waitForReturnToRolesList(page, `Creating the prerequisite staff role "${roleName}" did not return to the roles list`);
		await waitUntil(async () => await listPageOn(page).hasRoleNamed(roleName), `Prerequisite staff role "${roleName}" did not appear in the roles list`);
	});

/**
 * Task that opens the create staff role form, fills it, and submits it,
 * recording the baseline role count in actor notes for negative-path checks.
 */
export const CreateStaffRoleViaForm = (fields: Record<string, string>) =>
	Interaction.where(the`#actor creates a staff role named "${fields['roleName'] ?? ''}" via the staff portal`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await staffPortalPageOf(actor);
		const listPage = await openRolesList(page);
		await actor.attemptsTo(notes<StaffRoleE2ENotes>().set('baselineStaffRoleCount', (await listPage.listedRoleNames()).length));
		await listPage.clickCreateRole();
		await page.waitForURL((url) => url.pathname.endsWith('/staff-roles/create'), { timeout: 20_000 });
		const formPage = formPageOn(page);
		await formPage.roleNameInput.waitFor({ state: 'visible', timeout: 20_000 });
		await fillCreateForm(formPage, fields);
		await formPage.clickSubmit();
	});

/**
 * Task that creates a staff role and grants the given permissions before submitting.
 */
export const CreateStaffRoleWithPermissions = (roleName: string, permissionKeys: string[]) =>
	Interaction.where(the`#actor creates a staff role named "${roleName}" with permissions via the staff portal`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await staffPortalPageOf(actor);
		const formPage = await openCreateForm(page);
		await fillCreateForm(formPage, { roleName, enterpriseAppRole: DEFAULT_ENTERPRISE_APP_ROLE });
		for (const permissionKey of permissionKeys) {
			await formPage.grantPermission(permissionKey);
		}
		await formPage.clickSubmit();
	});

/**
 * Task that renames a staff role through the edit form.
 */
export const RenameStaffRoleViaForm = (currentName: string, newName: string) =>
	Interaction.where(the`#actor renames the staff role "${currentName}" to "${newName}" via the staff portal`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await staffPortalPageOf(actor);
		const formPage = await openEditFormFor(page, currentName);
		await formPage.fillRoleName(newName);
		await formPage.clickSubmit();
	});

/**
 * Task that grants a permission to a staff role through the edit form.
 */
export const GrantStaffRolePermissionViaForm = (permissionKey: string, roleName: string) =>
	Interaction.where(the`#actor grants the permission "${permissionKey}" to the staff role "${roleName}" via the staff portal`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await staffPortalPageOf(actor);
		const formPage = await openEditFormFor(page, roleName);
		await formPage.grantPermission(permissionKey);
		await formPage.clickSubmit();
	});

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
