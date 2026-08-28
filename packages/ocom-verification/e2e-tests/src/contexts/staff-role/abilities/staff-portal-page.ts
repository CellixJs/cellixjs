import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { StaffRoleFormPage, StaffRolesListPage } from '@ocom-verification/verification-shared/pages';
import { type AnswersQuestions, notes } from '@serenity-js/core';
import type { Page } from 'playwright';
import { type StaffPortalBusinessRole, staffPortalPageFor } from '../../../shared/abilities/staff-portal-session.ts';
import type { StaffE2ENotes } from '../../staff/abilities/staff-types.ts';

export const ROLES_LIST_PATH = '/staff/user-management/staff-roles';

/** Poll a browser condition until it holds or the timeout elapses. */
export const waitUntil = async (condition: () => Promise<boolean>, failureMessage: string | (() => string | Promise<string>), timeoutMs = 20_000): Promise<void> => {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (await condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	const message = typeof failureMessage === 'function' ? await failureMessage() : failureMessage;
	throw new Error(message);
};

/** Resolve the authenticated staff-portal page for the actor's business role. */
export const staffPortalPageOf = async (actor: AnswersQuestions): Promise<Page> => {
	let role: StaffPortalBusinessRole = 'case manager';
	try {
		role = (await actor.answer(notes<StaffE2ENotes>().get('businessRole'))) ?? 'case manager';
	} catch {
		// No business role noted yet; fall back to the default staff user.
	}
	return await staffPortalPageFor(role);
};

/** Staff roles list page object bound to the given browser page. */
export const listPageOn = (page: Page): StaffRolesListPage => new StaffRolesListPage(new PlaywrightPageAdapter(page));

/** Staff role form page object bound to the given browser page. */
export const formPageOn = (page: Page): StaffRoleFormPage => new StaffRoleFormPage(new PlaywrightPageAdapter(page));

export const isAtRolesList = (url: URL): boolean => url.pathname.endsWith('/staff-roles');

/**
 * Navigate to the staff roles list and wait for the table rows to render.
 *
 * Uses `domcontentloaded` rather than `networkidle` — Apollo cache-and-network
 * refetches and long-lived connections often prevent networkidle under full-suite load.
 */
export const openRolesList = async (page: Page): Promise<StaffRolesListPage> => {
	await page.goto(ROLES_LIST_PATH, { waitUntil: 'domcontentloaded', timeout: 30_000 });
	const listPage = listPageOn(page);
	await listPage.heading.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => undefined);
	await waitUntil(
		async () => (await listPage.listedRoleNames()).length > 0,
		() => diagnoseEmptyRolesList(page),
	);
	return listPage;
};

const diagnoseEmptyRolesList = async (page: Page): Promise<string> => {
	const pathname = new URL(page.url()).pathname;
	const bodyText = (
		await page
			.locator('body')
			.innerText()
			.catch(() => '')
	)
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 240);
	return `Timed out waiting for the staff roles list to render (path=${pathname}; body="${bodyText}")`;
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

/** Wait for the app to navigate back to the staff roles list. */
export const waitForReturnToRolesList = async (page: Page, failureMessage: string): Promise<void> => {
	await page.waitForURL(isAtRolesList, { timeout: 20_000 }).catch(() => {
		throw new Error(`${failureMessage} (still on ${new URL(page.url()).pathname})`);
	});
};
