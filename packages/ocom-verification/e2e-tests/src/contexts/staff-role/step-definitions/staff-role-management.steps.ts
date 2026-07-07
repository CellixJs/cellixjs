import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { AfterAll, type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { StaffRoleFormPage, StaffRolesListPage } from '@ocom-verification/verification-shared/pages';
import { actorCalled, notes } from '@serenity-js/core';
import type { Page } from 'playwright';
import type { StaffE2ENotes } from '../../staff/abilities/staff-types.ts';
import { closeStaffPortalSessions, type StaffPortalBusinessRole, staffPortalPageFor } from '../support/staff-portal-session.ts';

const ROLES_LIST_PATH = '/staff/user-management/staff-roles';
const DEFAULT_STAFF_ROLE_NAMES = ['Default Case Manager', 'Default Service Line Owner', 'Default Finance', 'Default Tech Admin'];
const DEFAULT_ENTERPRISE_APP_ROLE = 'Staff.CaseManager';

interface StaffRoleE2EState {
	actorName: string;
	role: StaffPortalBusinessRole;
	baselineRoleCount: number | undefined;
	listedRoleNames: string[] | undefined;
}

let state: StaffRoleE2EState = {
	actorName: 'Alice',
	role: 'case manager',
	baselineRoleCount: undefined,
	listedRoleNames: undefined,
};

/**
 * Reset the per-scenario staff-role E2E state. Called from the shared
 * `authenticated staff user` Givens in the staff context so both the
 * staff-landing and staff-role features stay in sync.
 */
export function resetStaffRoleE2EState(actorName: string, role: StaffPortalBusinessRole): void {
	state = { actorName, role, baselineRoleCount: undefined, listedRoleNames: undefined };
}

const waitUntil = async (condition: () => Promise<boolean>, failureMessage: string, timeoutMs = 20_000): Promise<void> => {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (await condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(failureMessage);
};

const activePage = (): Promise<Page> => staffPortalPageFor(state.role);

const listPageOn = (page: Page): StaffRolesListPage => new StaffRolesListPage(new PlaywrightPageAdapter(page));

const formPageOn = (page: Page): StaffRoleFormPage => new StaffRoleFormPage(new PlaywrightPageAdapter(page));

const isAtRolesList = (url: URL): boolean => url.pathname.endsWith('/staff-roles');

/** Navigate to the staff roles list and wait for the table rows to render. */
const openRolesList = async (page: Page): Promise<StaffRolesListPage> => {
	await page.goto(ROLES_LIST_PATH, { waitUntil: 'networkidle' });
	const listPage = listPageOn(page);
	await waitUntil(async () => (await listPage.listedRoleNames()).length > 0, 'Timed out waiting for the staff roles list to render');
	return listPage;
};

/** Open the create form from the roles list, recording the baseline role count. */
const openCreateForm = async (page: Page): Promise<StaffRoleFormPage> => {
	const listPage = await openRolesList(page);
	state.baselineRoleCount = (await listPage.listedRoleNames()).length;
	await listPage.clickCreateRole();
	await page.waitForURL((url) => url.pathname.endsWith('/staff-roles/create'), { timeout: 20_000 });
	const formPage = formPageOn(page);
	await formPage.roleNameInput.waitFor({ state: 'visible', timeout: 20_000 });
	return formPage;
};

/** Open the edit form for a role and wait for its values to load. */
const openEditFormFor = async (page: Page, roleName: string): Promise<StaffRoleFormPage> => {
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

const submitCreateForm = async (page: Page, dataTable: DataTable): Promise<void> => {
	const formPage = await openCreateForm(page);
	await fillCreateForm(formPage, dataTable.rowsHash());
	await formPage.clickSubmit();
};

const waitForReturnToRolesList = async (page: Page, failureMessage: string): Promise<void> => {
	await page.waitForURL(isAtRolesList, { timeout: 20_000 }).catch(() => {
		throw new Error(`${failureMessage} (still on ${new URL(page.url()).pathname})`);
	});
};

Given('a staff role named {string} exists', async (roleName: string) => {
	const page = await activePage();
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

When('{word} views the staff roles list', async (actorName: string) => {
	state.actorName = actorName;
	const page = await activePage();
	const listPage = await openRolesList(page);
	state.listedRoleNames = await listPage.listedRoleNames();
});

When('{word} creates a staff role with:', async (actorName: string, dataTable: DataTable) => {
	state.actorName = actorName;
	await submitCreateForm(await activePage(), dataTable);
});

When('{word} attempts to create a staff role with:', async (actorName: string, dataTable: DataTable) => {
	state.actorName = actorName;
	await submitCreateForm(await activePage(), dataTable);
});

When('{word} creates a staff role named {string} with permissions:', async (actorName: string, roleName: string, dataTable: DataTable) => {
	state.actorName = actorName;
	const page = await activePage();
	const formPage = await openCreateForm(page);
	await fillCreateForm(formPage, { roleName, enterpriseAppRole: DEFAULT_ENTERPRISE_APP_ROLE });
	for (const [permissionKey, value] of Object.entries(dataTable.rowsHash())) {
		if (value === 'true') {
			await formPage.grantPermission(permissionKey);
		}
	}
	await formPage.clickSubmit();
});

When('{word} renames the staff role {string} to {string}', async (actorName: string, currentName: string, newName: string) => {
	state.actorName = actorName;
	const page = await activePage();
	const formPage = await openEditFormFor(page, currentName);
	await formPage.fillRoleName(newName);
	await formPage.clickSubmit();
});

When('{word} grants the permission {string} to the staff role {string}', async (actorName: string, permissionKey: string, roleName: string) => {
	state.actorName = actorName;
	const page = await activePage();
	const formPage = await openEditFormFor(page, roleName);
	await formPage.grantPermission(permissionKey);
	await formPage.clickSubmit();
});

When('{word} opens the staff roles screen', async (actorName: string) => {
	state.actorName = actorName;
	const page = await activePage();
	await page.goto(ROLES_LIST_PATH, { waitUntil: 'networkidle' });
	await page.waitForURL((url) => url.pathname === '/unauthorized' || isAtRolesList(url), { timeout: 20_000 });
	const currentPath = new URL(page.url()).pathname;
	await actorCalled(actorName).attemptsTo(notes<StaffE2ENotes>().set('currentPath', currentPath));
});

Then('the staff roles list should include the default staff roles', () => {
	const listed = state.listedRoleNames;
	if (!listed) {
		throw new Error('No staff roles list was retrieved. Did the actor view the staff roles list first?');
	}
	const missing = DEFAULT_STAFF_ROLE_NAMES.filter((name) => !listed.includes(name));
	if (missing.length > 0) {
		throw new Error(`Expected default staff roles [${missing.join(', ')}] to be listed, but got: [${listed.join(', ')}]`);
	}
});

Then('the staff role should be created successfully', async () => {
	const page = await activePage();
	await waitForReturnToRolesList(page, 'Expected the staff role to be created and the app to return to the roles list');
});

Then('the staff role should be updated successfully', async () => {
	const page = await activePage();
	await waitForReturnToRolesList(page, 'Expected the staff role to be updated and the app to return to the roles list');
});

Then('the staff roles list should include {string}', async (roleName: string) => {
	const page = await activePage();
	const listPage = await openRolesList(page);
	await waitUntil(async () => await listPage.hasRoleNamed(roleName), `Expected staff roles list to include "${roleName}", but got: [${(await listPage.listedRoleNames()).join(', ')}]`);
});

Then('the staff role {string} should have the permission {string} granted', async (roleName: string, permissionKey: string) => {
	const page = await activePage();
	const formPage = await openEditFormFor(page, roleName);
	if (!(await formPage.isPermissionGranted(permissionKey))) {
		throw new Error(`Expected staff role "${roleName}" to have the permission "${permissionKey}" granted`);
	}
});

Then('{word} should see a staff role error containing {string}', async (_actorName: string, expectedFragment: string) => {
	const page = await activePage();
	const formPage = formPageOn(page);
	await waitUntil(async () => {
		if (!(await formPage.errorFeedback.isVisible())) {
			return false;
		}
		const text = (await formPage.errorFeedback.textContent()) ?? '';
		return text.includes(expectedFragment);
	}, `Expected a staff role error message containing "${expectedFragment}"`);
});

Then('{word} should see a staff role validation error for {string}', async (_actorName: string, fieldName: string) => {
	const page = await activePage();
	const formPage = formPageOn(page);
	const expectedPattern = fieldName === 'roleName' ? /role name/i : new RegExp(fieldName, 'i');
	await waitUntil(async () => {
		if (!(await formPage.firstValidationError.isVisible())) {
			return false;
		}
		const text = (await formPage.firstValidationError.textContent()) ?? '';
		return expectedPattern.test(text);
	}, `Expected a validation error for "${fieldName}"`);
});

Then('no additional staff role should be created', async () => {
	if (state.baselineRoleCount === undefined) {
		throw new Error('No baseline staff role count was recorded. Did the actor attempt to create a staff role first?');
	}
	const page = await activePage();
	const listPage = await openRolesList(page);
	const currentCount = (await listPage.listedRoleNames()).length;
	if (currentCount !== state.baselineRoleCount) {
		throw new Error(`Expected no additional staff role to be created, but the role count changed from ${state.baselineRoleCount} to ${currentCount}`);
	}
});

AfterAll(async () => {
	await closeStaffPortalSessions();
});
