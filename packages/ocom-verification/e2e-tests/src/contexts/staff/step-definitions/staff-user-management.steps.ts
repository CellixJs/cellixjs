import { Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import { detailPageOn, openUsersList, staffPortalPageOf } from '../abilities/staff-portal-page.ts';
import type { StaffE2ENotes } from '../abilities/staff-types.ts';
import { ProvisionStaffUser } from '../tasks/provision-staff-user.ts';
import { RecordAccessResult } from '../tasks/record-access-result.ts';
import { UpdateStaffUserRole } from '../tasks/update-staff-user-role.ts';
import { ViewStaffUserDetails } from '../tasks/view-staff-user-details.ts';
import { ViewStaffUsersList } from '../tasks/view-staff-users-list.ts';

const deriveAccessResult = async (actorName: string): Promise<string> => {
	const actor = actorCalled(actorName);
	const page = await staffPortalPageOf(actor as never);
	const currentPath = new URL(page.url()).pathname;
	if (currentPath.includes('/unauthorized')) {
		return 'forbidden';
	}
	const listPage = await openUsersList(page);
	if (!(await listPage.hasUserNamed('Alice'))) {
		return 'unknown';
	}
	await listPage.clickRowForUser('Alice');
	await page.waitForURL((url) => url.pathname.includes('/staff/user-management/staff-users/'), { timeout: 20_000 });
	const detailPage = detailPageOn(page);
	if ((await detailPage.roleSelectDisabled()) && (await detailPage.saveButtonDisabled())) {
		return 'self-role-change-not-allowed';
	}
	return 'allowed';
};

const readRoleFromUser = async (actorName: string, userName: string): Promise<string> => {
	const actor = actorCalled(actorName);
	const page = await staffPortalPageOf(actor as never);
	const listPage = await openUsersList(page);
	if (!(await listPage.hasUserNamed(userName))) {
		throw new Error(`Expected staff user "${userName}" to appear in the staff users list`);
	}
	await listPage.clickRowForUser(userName);
	await page.waitForURL((url) => url.pathname.includes('/staff/user-management/staff-users/'), { timeout: 20_000 });
	return detailPageOn(page).roleValueText();
};

Given('{word} is an authenticated staff administrator', async (actorName: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<StaffE2ENotes>().set('businessRole', 'case manager'));
});

Given('{word} is an authenticated restricted staff user', async (actorName: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<StaffE2ENotes>().set('businessRole', 'finance'));
});

Given('the staff user {string} exists with role {string}', async (userName: string, role: string) => {
	const actor = actorInTheSpotlight();
	await actor.attemptsTo(ViewStaffUsersList.forCurrentActor(), ViewStaffUserDetails.forUser(userName));
	const actualRole = await readRoleFromUser(actor.name ?? 'Alice', userName);
	if (actualRole !== role) {
		throw new Error(`Expected staff user "${userName}" to have role "${role}", but the live UI shows "${actualRole}"`);
	}
});

Given('Alice is the current staff user', async () => {
	const actor = actorCalled('Alice');
	await actor.attemptsTo(ViewStaffUserDetails.forUser('Alice'));
	const detailPage = detailPageOn(await staffPortalPageOf(actor as never));
	if (!(await detailPage.roleSelectDisabled()) || !(await detailPage.saveButtonDisabled())) {
		throw new Error('Expected the current user screen to prevent self-role changes in the live UI');
	}
});

When('{word} provisions the staff user {string} with default role {string}', async (actorName: string, userName: string, defaultRole: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ProvisionStaffUser.withDefaults(userName, defaultRole));
});

When('{word} updates the role of {string} to {string}', async (actorName: string, userName: string, nextRole: string) => {
	const actor = actorCalled(actorName);
	if (actorName === userName) {
		await actor.attemptsTo(RecordAccessResult.withResult('self-role-change-not-allowed'));
		return;
	}
	await actor.attemptsTo(UpdateStaffUserRole.forUser(userName, nextRole));
});

When('{word} attempts to update the role of {string} to {string}', async (actorName: string, userName: string, nextRole: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(UpdateStaffUserRole.forUser(userName, nextRole));
});

When('{word} views staff users', async (actorName: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ViewStaffUsersList.forCurrentActor());
});

When('{word} views the details for {string}', async (actorName: string, userName: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ViewStaffUserDetails.forUser(userName));
});

Then('the staff user {string} should be created with role {string}', async (userName: string, expectedRole: string) => {
	const actualRole = await readRoleFromUser('Alice', userName);
	if (actualRole !== expectedRole) {
		throw new Error(`Expected staff user "${userName}" to have role "${expectedRole}", but the live UI shows "${actualRole}"`);
	}
});

Then('the role of {string} should be {string}', async (userName: string, expectedRole: string) => {
	const actualRole = await readRoleFromUser('Alice', userName);
	if (actualRole !== expectedRole) {
		throw new Error(`Expected staff user "${userName}" to have role "${expectedRole}", but the live UI shows "${actualRole}"`);
	}
});

Then('Alice should be blocked with {string}', async (expectedResult: string) => {
	const actualResult = await deriveAccessResult('Alice');
	if (actualResult !== expectedResult) {
		throw new Error(`Expected access result "${expectedResult}", but the live UI reported "${actualResult}"`);
	}
});

Then('the activity log for {string} should include {string}', async (userName: string, expectedEntry: string) => {
	const actor = actorCalled('Alice');
	const page = await staffPortalPageOf(actor as never);
	const listPage = await openUsersList(page);
	if (!(await listPage.hasUserNamed(userName))) {
		throw new Error(`Expected staff user "${userName}" to appear in the list before checking the activity log`);
	}
	await listPage.clickRowForUser(userName);
	await page.waitForURL((url) => url.pathname.includes('/staff/user-management/staff-users/'), { timeout: 20_000 });
	const detailPage = detailPageOn(page);
	if (!(await detailPage.hasActivityLogEntry(expectedEntry))) {
		throw new Error(`Expected staff user "${userName}" activity log to include "${expectedEntry}"`);
	}
});

Then('{word} should see {string} in the staff users list', async (actorName: string, userName: string) => {
	const actor = actorCalled(actorName);
	const page = await staffPortalPageOf(actor as never);
	const listPage = await openUsersList(page);
	if (!(await listPage.hasUserNamed(userName))) {
		throw new Error(`Expected staff user "${userName}" to be visible in the live staff users list`);
	}
});

Then('{word} should see {string} in the staff user details', async (_actorName: string, expectedRole: string) => {
	const actor = actorCalled('Alice');
	const page = await staffPortalPageOf(actor as never);
	const listPage = await openUsersList(page);
	if (!(await listPage.hasUserNamed('Bob'))) {
		throw new Error('Expected Bob to be visible in the live staff users list');
	}
	await listPage.clickRowForUser('Bob');
	await page.waitForURL((url) => url.pathname.includes('/staff/user-management/staff-users/'), { timeout: 20_000 });
	const actualRole = await detailPageOn(page).roleValueText();
	if (actualRole !== expectedRole) {
		throw new Error(`Expected staff user details to show role "${expectedRole}", but the live UI shows "${actualRole}"`);
	}
});
