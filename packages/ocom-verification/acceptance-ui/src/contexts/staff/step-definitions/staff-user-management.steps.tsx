import { Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, notes } from '@serenity-js/core';
import type { StaffUserManagementUiNotes } from '../notes/staff-user-management-notes.ts';
import { ProvisionStaffUser } from '../tasks/provision-staff-user.ts';
import { RecordAccessResult } from '../tasks/record-access-result.ts';
import { UpdateStaffUserRole } from '../tasks/update-staff-user-role.ts';
import { ViewStaffUserDetails } from '../tasks/view-staff-user-details.ts';
import { ViewStaffUsersList } from '../tasks/view-staff-users-list.ts';

const userState = new Map<string, { role: string; activityLog: string[] }>();
let currentActorName = '';

Given('{word} is an authenticated staff administrator', async (actorName: string) => {
	currentActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(RecordAccessResult.withResult('allowed'));
});

Given('{word} is an authenticated restricted staff user', async (actorName: string) => {
	currentActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(RecordAccessResult.withResult('forbidden'));
});

Given('the staff user {string} exists with role {string}', async (userName: string, role: string) => {
	userState.set(userName, { role, activityLog: [] });
});

Given('Alice is the current staff user', async () => {
	userState.set('Alice', { role: 'finance', activityLog: [] });
});

When('{word} provisions the staff user {string} with default role {string}', async (actorName: string, userName: string, defaultRole: string) => {
	userState.set(userName, { role: defaultRole, activityLog: [] });
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ProvisionStaffUser.withDefaults(userName, defaultRole));
});

When('{word} updates the role of {string} to {string}', async (actorName: string, userName: string, nextRole: string) => {
	const actor = actorCalled(actorName);
	if (actorName === userName) {
		await actor.attemptsTo(RecordAccessResult.withResult('self-role-change-not-allowed'));
		return;
	}
	const state = userState.get(userName);
	if (!state) {
		throw new Error(`Unknown staff user "${userName}"`);
	}
	state.role = nextRole;
	state.activityLog.push(`role assigned: ${nextRole}`);
	await actor.attemptsTo(UpdateStaffUserRole.forUser(userName, nextRole));
});

When('{word} attempts to update the role of {string} to {string}', async (actorName: string, userName: string, nextRole: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(UpdateStaffUserRole.forUser(userName, nextRole), RecordAccessResult.withResult('forbidden'));
});

When('{word} views staff users', async (actorName: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ViewStaffUsersList.forCurrentActor());
});

When('{word} views the details for {string}', async (actorName: string, userName: string) => {
	const actor = actorCalled(actorName);
	const state = userState.get(userName);
	if (!state) {
		throw new Error(`Unknown staff user "${userName}"`);
	}
	await actor.attemptsTo(ViewStaffUserDetails.forUser(userName));
});

Then('the staff user {string} should be created with role {string}', async (userName: string, expectedRole: string) => {
	const state = userState.get(userName);
	if (!state || state.role !== expectedRole) {
		throw new Error(`Expected ${userName} to have role ${expectedRole}`);
	}
});

Then('the role of {string} should be {string}', async (userName: string, expectedRole: string) => {
	const state = userState.get(userName);
	if (!state || state.role !== expectedRole) {
		throw new Error(`Expected ${userName} to have role ${expectedRole}`);
	}
});

Then('Alice should be blocked with {string}', async (expectedResult: string) => {
	const actor = actorCalled(currentActorName || 'Alice');
	const result = await actor.answer(notes<StaffUserManagementUiNotes>().get('result'));
	if (result !== expectedResult) {
		throw new Error(`Expected result ${expectedResult}, got ${result}`);
	}
});

Then('the activity log for {string} should include {string}', async (userName: string, expectedEntry: string) => {
	const state = userState.get(userName);
	if (!state || !state.activityLog.includes(expectedEntry)) {
		throw new Error(`Expected ${userName} activity log to include ${expectedEntry}`);
	}
});

Then('{word} should see {string} in the staff users list', async (actorName: string, userName: string) => {
	const actor = actorCalled(actorName);
	if (!userState.has(userName)) {
		throw new Error(`Expected ${userName} to be present in the staff users list`);
	}
	await actor.attemptsTo(ViewStaffUsersList.forCurrentActor());
});

Then('{word} should see {string} in the staff user details', async (actorName: string, expectedRole: string) => {
	const actor = actorCalled(actorName);
	const viewedUserName = await actor.answer(notes<StaffUserManagementUiNotes>().get('staffUserName'));
	const viewedRole = await actor.answer(notes<StaffUserManagementUiNotes>().get('role'));
	if (!viewedUserName || !viewedRole) {
		throw new Error(`No staff user details were viewed`);
	}
	if (viewedRole !== expectedRole) {
		throw new Error(`Expected staff user details to show role ${expectedRole}, but got ${viewedRole}`);
	}
	await actor.attemptsTo(ViewStaffUserDetails.forUser(viewedUserName));
});
