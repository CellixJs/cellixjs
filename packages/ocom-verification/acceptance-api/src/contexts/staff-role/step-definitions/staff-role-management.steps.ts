import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { DEFAULT_STAFF_ROLE_NAMES } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import { setActorToken } from '../../../shared/abilities/actor-auth.ts';
import type { StaffRoleDetails, StaffRoleNotes } from '../notes/staff-role-notes.ts';
import { BaselineStaffRoleCount, ListedStaffRoleNames, StaffRoleError, StaffRoleStatus } from '../questions/staff-role-outcome.ts';
import { StaffRolePermission } from '../questions/staff-role-permission.ts';
import { StaffRolesList } from '../questions/staff-roles-list.ts';
import { StaffUserNamed } from '../questions/staff-user-named.ts';
import { ViewedStaffRole } from '../questions/viewed-staff-role.ts';
import { AssignStaffRoleToUser } from '../tasks/assign-staff-role-to-user.ts';
import { CreateStaffRole } from '../tasks/create-staff-role.ts';
import { DeleteStaffRole } from '../tasks/delete-staff-role.ts';
import { EnsureStaffRoleExists } from '../tasks/ensure-staff-role-exists.ts';
import { GrantStaffRolePermission } from '../tasks/grant-staff-role-permission.ts';
import { RenameStaffRole } from '../tasks/rename-staff-role.ts';
import { ViewStaffRoleDetails } from '../tasks/view-staff-role-details.ts';
import { ViewStaffRolesList } from '../tasks/view-staff-roles-list.ts';

const errorMessageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const clearStaffRoleOutcomeNotes = (actor: ReturnType<typeof actorCalled>) =>
	actor.attemptsTo(
		notes<StaffRoleNotes>().set('lastStaffRoleStatus', undefined as unknown as string),
		notes<StaffRoleNotes>().set('lastStaffRoleError', undefined as unknown as string),
		notes<StaffRoleNotes>().set('lastStaffRoleId', undefined as unknown as string),
		notes<StaffRoleNotes>().set('lastStaffRoleName', undefined as unknown as string),
	);

Given('{word} is not authenticated', (actorName: string) => {
	setActorToken(actorName, null);
	actorCalled(actorName);
});

Given('a staff role named {string} exists', async (roleName: string) => {
	await actorInTheSpotlight().attemptsTo(EnsureStaffRoleExists.named(roleName));
});

When('{word} views the staff roles list', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(ViewStaffRolesList.displayed());
});

When('{word} attempts to view the staff roles list', async (actorName: string) => {
	const actor = actorCalled(actorName);
	await clearStaffRoleOutcomeNotes(actor);
	try {
		await actor.attemptsTo(ViewStaffRolesList.displayed());
	} catch (error) {
		await actor.attemptsTo(notes<StaffRoleNotes>().set('lastStaffRoleError', errorMessageOf(error)));
	}
});

When('{word} views the details of the staff role {string}', async (actorName: string, roleName: string) => {
	await actorCalled(actorName).attemptsTo(ViewStaffRoleDetails.of(roleName));
});

When('{word} creates a staff role with:', async (actorName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<StaffRoleDetails>();
	await actorCalled(actorName).attemptsTo(CreateStaffRole.with(details));
});

When('{word} attempts to create a staff role with:', async (actorName: string, dataTable: DataTable) => {
	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<Partial<StaffRoleDetails>>();

	await clearStaffRoleOutcomeNotes(actor);
	const baselineRoles = await actor.answer(StaffRolesList.displayed());
	await actor.attemptsTo(notes<StaffRoleNotes>().set('baselineStaffRoleCount', baselineRoles.length));

	try {
		await actor.attemptsTo(CreateStaffRole.with({ roleName: details.roleName ?? '', enterpriseAppRole: details.enterpriseAppRole }));
	} catch (error) {
		await actor.attemptsTo(notes<StaffRoleNotes>().set('lastStaffRoleError', errorMessageOf(error)));
	}
});

When('{word} creates a staff role named {string} with permissions:', async (actorName: string, roleName: string, dataTable: DataTable) => {
	const flatPermissions = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const permissions = Object.fromEntries(Object.entries(flatPermissions).map(([key, value]) => [key, value === 'true']));
	await actorCalled(actorName).attemptsTo(CreateStaffRole.with({ roleName, enterpriseAppRole: 'Staff.CaseManager', permissions }));
});

When('{word} renames the staff role {string} to {string}', async (actorName: string, currentName: string, newName: string) => {
	await actorCalled(actorName).attemptsTo(RenameStaffRole.from(currentName).to(newName));
});

When('{word} grants the permission {string} to the staff role {string}', async (actorName: string, permissionKey: string, roleName: string) => {
	await actorCalled(actorName).attemptsTo(GrantStaffRolePermission.grant(permissionKey).to(roleName));
});

When('{word} assigns the staff role {string} to the staff user {string}', async (actorName: string, roleName: string, staffUserDisplayName: string) => {
	await actorCalled(actorName).attemptsTo(AssignStaffRoleToUser.assign(roleName).to(staffUserDisplayName));
});

When('{word} deletes the staff role {string}', async (actorName: string, roleName: string) => {
	await actorCalled(actorName).attemptsTo(DeleteStaffRole.named(roleName));
});

When('{word} attempts to delete the staff role {string}', async (actorName: string, roleName: string) => {
	const actor = actorCalled(actorName);
	await clearStaffRoleOutcomeNotes(actor);
	try {
		await actor.attemptsTo(DeleteStaffRole.named(roleName));
	} catch (error) {
		await actor.attemptsTo(notes<StaffRoleNotes>().set('lastStaffRoleError', errorMessageOf(error)));
	}
});

Then('the staff roles list should include the default staff roles', async () => {
	const listed = await actorInTheSpotlight().answer(ListedStaffRoleNames.recorded());
	if (!listed) {
		throw new Error('No staff roles list was retrieved. Did the actor view the staff roles list first?');
	}
	const missing = DEFAULT_STAFF_ROLE_NAMES.filter((name) => !listed.includes(name));
	if (missing.length > 0) {
		throw new Error(`Expected default staff roles [${missing.join(', ')}] to be listed, but got: [${listed.join(', ')}]`);
	}
});

Then('the staff roles list should include {string}', async (roleName: string) => {
	const roles = await actorInTheSpotlight().answer(StaffRolesList.displayed());
	const names = roles.map((role) => role.roleName);
	if (!names.includes(roleName)) {
		throw new Error(`Expected staff roles list to include "${roleName}", but got: [${names.join(', ')}]`);
	}
});

Then('she should see the staff role name {string}', async (expectedName: string) => {
	const actualName = await actorInTheSpotlight().answer(ViewedStaffRole.roleName());
	if (actualName !== expectedName) {
		throw new Error(`Expected staff role name "${expectedName}", but got "${actualName}"`);
	}
});

Then('she should see the enterprise app role {string}', async (expectedEnterpriseAppRole: string) => {
	const actualEnterpriseAppRole = await actorInTheSpotlight().answer(ViewedStaffRole.enterpriseAppRole());
	if (actualEnterpriseAppRole !== expectedEnterpriseAppRole) {
		throw new Error(`Expected enterprise app role "${expectedEnterpriseAppRole}", but got "${actualEnterpriseAppRole}"`);
	}
});

Then('the staff role should be created successfully', async () => {
	const status = await actorInTheSpotlight().answer(StaffRoleStatus.of());
	if (status !== 'SUCCESS') {
		const capturedError = await actorInTheSpotlight().answer(StaffRoleError.captured());
		throw new Error(`Expected staff role creation to succeed, but it failed: ${capturedError ?? 'no mutation was performed'}`);
	}
});

Then('the staff role should be updated successfully', async () => {
	const status = await actorInTheSpotlight().answer(StaffRoleStatus.of());
	if (status !== 'SUCCESS') {
		const capturedError = await actorInTheSpotlight().answer(StaffRoleError.captured());
		throw new Error(`Expected staff role update to succeed, but it failed: ${capturedError ?? 'no mutation was performed'}`);
	}
});

Then('the staff role should be deleted successfully', async () => {
	const status = await actorInTheSpotlight().answer(StaffRoleStatus.of());
	if (status !== 'SUCCESS') {
		const capturedError = await actorInTheSpotlight().answer(StaffRoleError.captured());
		throw new Error(`Expected staff role deletion to succeed, but it failed: ${capturedError ?? 'no mutation was performed'}`);
	}
});

Then('the staff roles list should not include {string}', async (roleName: string) => {
	const roles = await actorInTheSpotlight().answer(StaffRolesList.displayed());
	const names = roles.map((role) => role.roleName);
	if (names.includes(roleName)) {
		throw new Error(`Expected staff roles list to no longer include "${roleName}", but got: [${names.join(', ')}]`);
	}
});

Then('the staff role {string} should have the permission {string} granted', async (roleName: string, permissionKey: string) => {
	const granted = await actorInTheSpotlight().answer(StaffRolePermission.granted(roleName, permissionKey));
	if (!granted) {
		throw new Error(`Expected staff role "${roleName}" to have permission "${permissionKey}" granted, but it is not`);
	}
});

Then('the staff user {string} should have the staff role {string}', async (staffUserDisplayName: string, roleName: string) => {
	// Integration event handlers run fire-and-forget after the mutation commits,
	// so reassignment may complete shortly after the delete response. Poll briefly.
	const deadline = Date.now() + 5_000;
	let lastSeenRoleName: string | undefined;
	while (Date.now() < deadline) {
		const staffUser = await actorInTheSpotlight().answer(StaffUserNamed.called(staffUserDisplayName));
		lastSeenRoleName = staffUser.role?.roleName;
		if (lastSeenRoleName === roleName) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`Expected staff user "${staffUserDisplayName}" to have role "${roleName}", but got "${lastSeenRoleName ?? 'none'}"`);
});

Then('she should see a staff role error containing {string}', async (expectedFragment: string) => {
	const capturedError = await actorInTheSpotlight().answer(StaffRoleError.captured());
	if (!capturedError) {
		throw new Error(`Expected a staff role error containing "${expectedFragment}", but no error was captured`);
	}
	if (!capturedError.toLowerCase().includes(expectedFragment.toLowerCase())) {
		throw new Error(`Expected staff role error to contain "${expectedFragment}", but got: "${capturedError}"`);
	}
});

Then('she should see a staff role validation error for {string}', async (fieldName: string) => {
	const capturedError = await actorInTheSpotlight().answer(StaffRoleError.captured());
	if (!capturedError) {
		throw new Error(`Expected a validation error for "${fieldName}", but no error was captured`);
	}
	const isFieldMentioned = capturedError.toLowerCase().includes(fieldName.toLowerCase());
	const isValidationPattern = /cannot be empty|required|missing|invalid|must not be empty|too short|too long|wrong.*type/i.test(capturedError);
	if (!isFieldMentioned && !isValidationPattern) {
		throw new Error(`Expected a validation error related to "${fieldName}", but got: "${capturedError}"`);
	}
});

Then('no additional staff role should be created', async () => {
	const actor = actorInTheSpotlight();
	const baselineCount = await actor.answer(BaselineStaffRoleCount.recorded());
	if (baselineCount === undefined) {
		throw new Error('No baseline staff role count was captured. Did the actor attempt to create a staff role first?');
	}

	const createdStatus = await actor.answer(StaffRoleStatus.of());
	if (createdStatus === 'SUCCESS') {
		throw new Error('Expected staff role creation to be blocked, but the mutation reported success');
	}

	const roles = await actor.answer(StaffRolesList.displayed());
	if (roles.length !== baselineCount) {
		throw new Error(`Expected staff role count to remain ${baselineCount}, but got ${roles.length}`);
	}
});

Then('the staff roles request should be rejected as unauthorized', async () => {
	const capturedError = await actorInTheSpotlight().answer(StaffRoleError.captured());
	if (!capturedError) {
		throw new Error('Expected the staff roles request to be rejected, but it succeeded');
	}
	if (!capturedError.toLowerCase().includes('unauthorized')) {
		throw new Error(`Expected an unauthorized error, but got: "${capturedError}"`);
	}
});
