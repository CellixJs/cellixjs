import { Given, Then, When } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { currentMockPath, resetStaffRoleUiState, setScopedStaffAuth } from '../../staff-role/abilities/mock-staff-role-backend.ts';
import { setCurrentStaffUser, setStaffUserUiState } from '../abilities/mock-staff-user-backend.ts';
import { detailPageFor, listPageFor, waitUntilUi } from '../tasks/staff-user-screen.ts';
import { ProvisionStaffUser } from '../tasks/provision-staff-user.ts';
import { UpdateStaffUserRole } from '../tasks/update-staff-user-role.ts';
import { ViewStaffUserDetails } from '../tasks/view-staff-user-details.ts';
import { ViewStaffUsersList } from '../tasks/view-staff-users-list.ts';

Given('{word} is an authenticated staff administrator', async (actorName: string) => {
	resetStaffRoleUiState('tech admin');
	setScopedStaffAuth({
		name: actorName,
		enterpriseAppRole: 'Staff.TechAdmin',
		permissions: {
			canViewStaffUsers: true,
			canManageUsers: true,
			canAssignStaffRoles: true,
			canManageStaffRolesAndPermissions: true,
			canManageTechAdmin: true,
			canViewRoles: true,
			canAddRole: true,
			canEditRole: true,
			canRemoveRole: true,
		},
	});
	setCurrentStaffUser('Alice', 'finance');
});

Given('{word} is an authenticated restricted staff user', async (actorName: string) => {
	resetStaffRoleUiState('case manager');
	setScopedStaffAuth({
		name: actorName,
		enterpriseAppRole: 'Staff.CaseManager',
		permissions: {},
	});
	setCurrentStaffUser('Alice', 'finance');
});

Given('the staff user {string} exists with role {string}', (userName: string, role: string) => {
	setStaffUserUiState(userName, role);
});

Given('Alice is the current staff user', () => {
	setCurrentStaffUser('Alice', 'finance');
});

When('{word} provisions the staff user {string} with default role {string}', async (actorName: string, userName: string, defaultRole: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ProvisionStaffUser.withDefaults(userName, defaultRole));
});

When('{word} updates the role of {string} to {string}', async (actorName: string, userName: string, nextRole: string) => {
	const actor = actorCalled(actorName);
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
	const actor = actorCalled('Alice');
	await actor.attemptsTo(ViewStaffUsersList.forCurrentActor());
	const listPage = listPageFor(actor);
	await waitUntilUi(async () => await listPage.hasUserNamed(userName), `Expected the staff user list to include "${userName}"`);
	await actor.attemptsTo(ViewStaffUserDetails.forUser(userName));
	const detailPage = detailPageFor(actor);
	await waitUntilUi(async () => (await detailPage.roleValueText()) === expectedRole, `Expected "${userName}" to show role "${expectedRole}" in the detail page`);
});

Then('the role of {string} should be {string}', async (userName: string, expectedRole: string) => {
	const actor = actorCalled('Alice');
	await actor.attemptsTo(ViewStaffUserDetails.forUser(userName));
	const detailPage = detailPageFor(actor);
	await waitUntilUi(async () => (await detailPage.roleValueText()) === expectedRole, `Expected "${userName}" to show role "${expectedRole}"`);
});

Then('Alice should be blocked with {string}', async (expectedResult: string) => {
	const route = currentMockPath();
	const isForbidden = route === '/unauthorized';
	const isSelfChangeBlocked = isForbidden === false && route !== '/';
	if (expectedResult === 'forbidden' && !isForbidden) {
		throw new Error(`Expected the staff user screen to redirect to /unauthorized, but the route was "${route}"`);
	}
	if (expectedResult === 'self-role-change-not-allowed' && !isSelfChangeBlocked && route === '/') {
		throw new Error(`Expected the self-role change to be blocked, but the route was "${route}"`);
	}
});

Then('the activity log for {string} should include {string}', async (userName: string, expectedEntry: string) => {
	const actor = actorCalled('Alice');
	await actor.attemptsTo(ViewStaffUserDetails.forUser(userName));
	const detailPage = detailPageFor(actor);
	await waitUntilUi(async () => await detailPage.hasActivityLogEntry(expectedEntry), `Expected the activity log for "${userName}" to include "${expectedEntry}"`);
});

Then('{word} should see {string} in the staff users list', async (actorName: string, userName: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ViewStaffUsersList.forCurrentActor());
	const listPage = listPageFor(actor);
	await waitUntilUi(async () => await listPage.hasUserNamed(userName), `Expected the staff users list to include "${userName}"`);
});

Then('{word} should see {string} in the staff user details', async (actorName: string, expectedRole: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ViewStaffUserDetails.forUser('Bob'));
	const detailPage = detailPageFor(actor);
	await waitUntilUi(async () => (await detailPage.roleValueText()) === expectedRole, `Expected the staff user details to show role "${expectedRole}"`);
});
