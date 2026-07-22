import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { StaffUserDetailPage, StaffUsersListPage } from '@ocom-verification/verification-shared/pages';
import type { Page } from 'playwright';
import { waitUntil } from './staff-portal-page.ts';

const USERS_LIST_PATH = '/staff/user-management/staff-users';

/** Staff users list page object bound to the given browser page. */
const usersListPageOn = (page: Page): StaffUsersListPage => new StaffUsersListPage(new PlaywrightPageAdapter(page));

/** Staff user detail page object bound to the given browser page. */
export const userDetailPageOn = (page: Page): StaffUserDetailPage => new StaffUserDetailPage(new PlaywrightPageAdapter(page));

/** Navigate to the staff users list and wait for the table rows to render. */
const openUsersList = async (page: Page): Promise<StaffUsersListPage> => {
	await page.goto(USERS_LIST_PATH, { waitUntil: 'networkidle' });
	const listPage = usersListPageOn(page);
	await waitUntil(async () => await listPage.heading.isVisible(), 'Timed out waiting for the staff users list to render');
	return listPage;
};

/**
 * Open the detail screen for a staff user from the users list and wait for the
 * assigned-role section to load. Performs a full page load so the screen shows
 * fresh (uncached) data.
 */
export const openUserDetailFor = async (page: Page, displayName: string): Promise<StaffUserDetailPage> => {
	const listPage = await openUsersList(page);
	await listPage.clickEditForUser(displayName);
	await page.waitForURL((url) => /\/staff-users\/[^/]+$/.test(url.pathname), { timeout: 20_000 });
	const detailPage = userDetailPageOn(page);
	await waitUntil(async () => await detailPage.heading.isVisible(), `Timed out waiting for the staff user detail of "${displayName}" to load`);
	await waitUntil(async () => (await detailPage.displayedRoleName()) !== '', `Timed out waiting for the assigned role of "${displayName}" to load`);
	return detailPage;
};
