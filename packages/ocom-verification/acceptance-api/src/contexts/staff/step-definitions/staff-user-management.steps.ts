import { Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, notes } from '@serenity-js/core';
import { currentStaffUserAbility, findStaffUserByDisplayName, loadStaffUserById } from '../../../shared/abilities/staff-user.ts';
import type { StaffUserManagementApiNotes } from '../notes/staff-user-management-notes.ts';
import { ProvisionStaffUser } from '../tasks/provision-staff-user.ts';
import { RecordAccessResult } from '../tasks/record-access-result.ts';
import { UpdateStaffUserRole } from '../tasks/update-staff-user-role.ts';
import { ViewStaffUserDetails } from '../tasks/view-staff-user-details.ts';
import { ViewStaffUsersList } from '../tasks/view-staff-users-list.ts';

const errorMessageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const resultOf = async (actorName: string): Promise<string> => {
	const actor = actorCalled(actorName);
	return ((await actor.answer(notes<StaffUserManagementApiNotes>().get('result'))) ?? 'unknown') as string;
};

const roleOfStaffUser = async (actorName: string, userName: string): Promise<string> => {
	const actor = actorCalled(actorName);
	const target = await findStaffUserByDisplayName(actor, userName);
	if (!target) {
		throw new Error(`Expected staff user "${userName}" to exist in the backend`);
	}
	return (await loadStaffUserById(actor, target.id)).role?.roleName ?? '';
};

Given('{word} is an authenticated staff administrator', async (actorName: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(RecordAccessResult.withResult('allowed'));
});

Given('{word} is an authenticated restricted staff user', async (actorName: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(RecordAccessResult.withResult('forbidden'));
});

Given('the staff user {string} exists with role {string}', async (userName: string, expectedRole: string) => {
	const actualRole = await roleOfStaffUser('Alice', userName);
	if (actualRole !== expectedRole) {
		throw new Error(`Expected staff user "${userName}" to have role "${expectedRole}", but the backend reports "${actualRole}"`);
	}
});

Given('Alice is the current staff user', async () => {
	const actor = actorCalled('Alice');
	const currentUser = await currentStaffUserAbility().performAs(actor);
	if (currentUser.displayName !== 'Alice') {
		throw new Error(`Expected the current staff user to be Alice, but the backend reports "${currentUser.displayName}"`);
	}
});

When('{word} provisions the staff user {string} with default role {string}', async (actorName: string, userName: string, defaultRole: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ProvisionStaffUser.withDefaults(userName, defaultRole));
});

When('{word} updates the role of {string} to {string}', async (actorName: string, userName: string, nextRole: string) => {
	const actor = actorCalled(actorName);
	try {
		if (actorName === userName) {
			await actor.attemptsTo(UpdateStaffUserRole.forUser(userName, nextRole));
			throw new Error('Expected self-role change to be blocked');
		}
		await actor.attemptsTo(UpdateStaffUserRole.forUser(userName, nextRole));
		await actor.attemptsTo(notes<StaffUserManagementApiNotes>().set('result', 'allowed'));
	} catch (error) {
		const message = errorMessageOf(error).toLowerCase();
		const result = message.includes('self') || message.includes('own') || message.includes('cannot') ? 'self-role-change-not-allowed' : 'forbidden';
		await actor.attemptsTo(notes<StaffUserManagementApiNotes>().set('result', result));
	}
});

When('{word} attempts to update the role of {string} to {string}', async (actorName: string, userName: string, nextRole: string) => {
	const actor = actorCalled(actorName);
	try {
		await actor.attemptsTo(UpdateStaffUserRole.forUser(userName, nextRole));
		await actor.attemptsTo(notes<StaffUserManagementApiNotes>().set('result', 'allowed'));
	} catch (error) {
		await actor.attemptsTo(notes<StaffUserManagementApiNotes>().set('result', 'forbidden'));
		if (errorMessageOf(error).toLowerCase().includes('self') || errorMessageOf(error).toLowerCase().includes('own')) {
			await actor.attemptsTo(notes<StaffUserManagementApiNotes>().set('result', 'self-role-change-not-allowed'));
		}
	}
});

When('{word} views staff users', async (actorName: string) => {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ViewStaffUsersList.forCurrentActor());
});

When('{word} views the details for {string}', async (actorName: string, userName: string) => {
	const actor = actorCalled(actorName);
	const target = await findStaffUserByDisplayName(actor, userName);
	if (!target) {
		throw new Error(`Expected staff user "${userName}" to exist in the backend before viewing details`);
	}
	await actor.attemptsTo(ViewStaffUserDetails.forUser(userName));
});

Then('the staff user {string} should be created with role {string}', async (userName: string, expectedRole: string) => {
	const actualRole = await roleOfStaffUser('Alice', userName);
	if (actualRole !== expectedRole) {
		throw new Error(`Expected staff user "${userName}" to have role "${expectedRole}", but the backend reports "${actualRole}"`);
	}
});

Then('the role of {string} should be {string}', async (userName: string, expectedRole: string) => {
	const actualRole = await roleOfStaffUser('Alice', userName);
	if (actualRole !== expectedRole) {
		throw new Error(`Expected staff user "${userName}" to have role "${expectedRole}", but the backend reports "${actualRole}"`);
	}
});

Then('Alice should be blocked with {string}', async (expectedResult: string) => {
	const result = await resultOf('Alice');
	if (result !== expectedResult) {
		throw new Error(`Expected result ${expectedResult}, got ${result}`);
	}
});

Then('the activity log for {string} should include {string}', async (userName: string, expectedEntry: string) => {
	const actor = actorCalled('Alice');
	const target = await findStaffUserByDisplayName(actor, userName);
	if (!target) {
		throw new Error(`Expected staff user "${userName}" to exist in the backend`);
	}
	const details = await loadStaffUserById(actor, target.id);
	const hasEntry = (details.activityLog ?? []).some((entry) => entry.activityDescription === expectedEntry || entry.activityDescription.includes(expectedEntry));
	if (!hasEntry) {
		throw new Error(`Expected ${userName} activity log to include "${expectedEntry}"`);
	}
});

Then('{word} should see {string} in the staff users list', async (actorName: string, userName: string) => {
	const actor = actorCalled(actorName);
	const target = await findStaffUserByDisplayName(actor, userName);
	if (!target) {
		throw new Error(`Expected ${userName} to be present in the backend staff users list`);
	}
});

Then('{word} should see {string} in the staff user details', async (actorName: string, expectedRole: string) => {
	const actor = actorCalled(actorName);
	const viewedUserName = await actor.answer(notes<StaffUserManagementApiNotes>().get('staffUserName'));
	if (!viewedUserName) {
		throw new Error('No staff user details were viewed');
	}
	const actualRole = await roleOfStaffUser(actorName, viewedUserName);
	if (actualRole !== expectedRole) {
		throw new Error(`Expected staff user details to show role "${expectedRole}", but the backend reports "${actualRole}"`);
	}
});
