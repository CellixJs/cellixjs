import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { StaffUserDetailPage, StaffUsersListPage } from '@ocom-verification/verification-shared/pages';
import { type AnswersQuestions, notes } from '@serenity-js/core';
import type { Page } from 'playwright';
import { type StaffPortalBusinessRole, staffPortalPageFor } from '../../../shared/abilities/staff-portal-session.ts';
import type { StaffE2ENotes } from '../../staff/abilities/staff-types.ts';

export const USERS_LIST_PATH = '/staff/user-management/staff-users';

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

export const staffPortalPageOf = async (actor: AnswersQuestions): Promise<Page> => {
	let role: StaffPortalBusinessRole = 'case manager';
	try {
		role = (await actor.answer(notes<StaffE2ENotes>().get('businessRole'))) ?? 'case manager';
	} catch {
		// No business role noted yet; fall back to the default staff user.
	}
	return await staffPortalPageFor(role);
};

export const listPageOn = (page: Page): StaffUsersListPage => new StaffUsersListPage(new PlaywrightPageAdapter(page));

export const detailPageOn = (page: Page): StaffUserDetailPage => new StaffUserDetailPage(new PlaywrightPageAdapter(page));

export const openUsersList = async (page: Page): Promise<StaffUsersListPage> => {
	await page.goto(USERS_LIST_PATH, { waitUntil: 'networkidle' });
	const listPage = listPageOn(page);
	await waitUntil(async () => (await listPage.listedUserNames()).length > 0, 'Timed out waiting for the staff users list to render');
	return listPage;
};
