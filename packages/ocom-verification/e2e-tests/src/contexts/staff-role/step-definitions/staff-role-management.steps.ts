import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { AfterAll, type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { DEFAULT_STAFF_ROLE_NAMES } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import { closeStaffPortalSessions } from '../../../shared/abilities/staff-portal-session.ts';
import { OpenEditStaffRoleForm } from '../interactions/open-edit-staff-role-form.ts';
import {
	BaselineStaffRoleCount,
	CurrentStaffRoleCount,
	DeleteActionVisible,
	DeleteConfirmationText,
	RecordedStaffRoleNames,
	ReturnedToStaffRolesList,
	StaffRoleErrorContaining,
	StaffRolePermissionGranted,
	StaffRolesListExcludes,
	StaffRolesListIncludes,
	StaffRoleValidationErrorFor,
} from '../questions/staff-role-screen.ts';
import { StaffUserAssignedRole } from '../questions/staff-user-screen.ts';
import { AssignStaffRoleToUserViaDetail } from '../tasks/assign-staff-role-to-user.ts';
import { CreateStaffRoleViaForm, CreateStaffRoleWithPermissions } from '../tasks/create-staff-role.ts';
import { CancelStaffRoleDeletion, DeleteStaffRoleViaForm, StartDeletingStaffRole } from '../tasks/delete-staff-role.ts';
import { EnsureStaffRoleExists } from '../tasks/ensure-staff-role-exists.ts';
import { GrantStaffRolePermissionViaForm } from '../tasks/grant-staff-role-permission.ts';
import { OpenStaffRolesScreenRecordingPath } from '../tasks/open-staff-roles-screen.ts';
import { RenameStaffRoleViaForm } from '../tasks/rename-staff-role.ts';
import { ViewStaffRolesList } from '../tasks/view-staff-roles-list.ts';

Given('a staff role named {string} exists', async (roleName: string) => {
	await actorInTheSpotlight().attemptsTo(EnsureStaffRoleExists(roleName));
});

When('{word} views the staff roles list', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(ViewStaffRolesList());
});

When('{word} creates a staff role with:', async (actorName: string, dataTable: DataTable) => {
	const fields = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	await actorCalled(actorName).attemptsTo(CreateStaffRoleViaForm(fields));
});

When('{word} attempts to create a staff role with:', async (actorName: string, dataTable: DataTable) => {
	const fields = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	await actorCalled(actorName).attemptsTo(CreateStaffRoleViaForm(fields));
});

When('{word} creates a staff role named {string} with permissions:', async (actorName: string, roleName: string, dataTable: DataTable) => {
	const grants = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const permissionKeys = Object.entries(grants)
		.filter(([, value]) => value === 'true')
		.map(([permissionKey]) => permissionKey);
	await actorCalled(actorName).attemptsTo(CreateStaffRoleWithPermissions(roleName, permissionKeys));
});

When('{word} renames the staff role {string} to {string}', async (actorName: string, currentName: string, newName: string) => {
	await actorCalled(actorName).attemptsTo(RenameStaffRoleViaForm(currentName, newName));
});

When('{word} grants the permission {string} to the staff role {string}', async (actorName: string, permissionKey: string, roleName: string) => {
	await actorCalled(actorName).attemptsTo(GrantStaffRolePermissionViaForm(permissionKey, roleName));
});

When('{word} opens the staff roles screen', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(OpenStaffRolesScreenRecordingPath());
});

When('{word} views the details of the staff role {string}', async (actorName: string, roleName: string) => {
	await actorCalled(actorName).attemptsTo(OpenEditStaffRoleForm(roleName));
});

When('{word} assigns the staff role {string} to the staff user {string}', async (actorName: string, roleName: string, staffUserDisplayName: string) => {
	await actorCalled(actorName).attemptsTo(AssignStaffRoleToUserViaDetail(roleName, staffUserDisplayName));
});

When('{word} deletes the staff role {string}', async (actorName: string, roleName: string) => {
	await actorCalled(actorName).attemptsTo(DeleteStaffRoleViaForm(roleName));
});

When('{word} starts deleting the staff role {string}', async (actorName: string, roleName: string) => {
	await actorCalled(actorName).attemptsTo(StartDeletingStaffRole(roleName));
});

When('{word} cancels the staff role deletion', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(CancelStaffRoleDeletion());
});

Then('the staff roles list should include the default staff roles', async () => {
	const listed = await actorInTheSpotlight().answer(RecordedStaffRoleNames());
	const missing = DEFAULT_STAFF_ROLE_NAMES.filter((name) => !listed.includes(name));
	if (missing.length > 0) {
		throw new Error(`Expected default staff roles [${missing.join(', ')}] to be listed, but got: [${listed.join(', ')}]`);
	}
});

Then('the staff role should be created successfully', async () => {
	await actorInTheSpotlight().answer(ReturnedToStaffRolesList('Expected the staff role to be created and the app to return to the roles list'));
});

Then('the staff role should be updated successfully', async () => {
	await actorInTheSpotlight().answer(ReturnedToStaffRolesList('Expected the staff role to be updated and the app to return to the roles list'));
});

Then('the staff roles list should include {string}', async (roleName: string) => {
	await actorInTheSpotlight().answer(StaffRolesListIncludes(roleName));
});

Then('the staff role should be deleted successfully', async () => {
	await actorInTheSpotlight().answer(ReturnedToStaffRolesList('Expected the staff role to be deleted and the app to return to the roles list'));
});

Then('the staff roles list should not include {string}', async (roleName: string) => {
	await actorInTheSpotlight().answer(StaffRolesListExcludes(roleName));
});

Then('{word} should not see a delete action for the staff role', async (_actorName: string) => {
	if (await actorInTheSpotlight().answer(DeleteActionVisible())) {
		throw new Error('Expected the staff role delete action to be hidden, but it is visible');
	}
});

Then('{word} should see a delete confirmation explaining assigned staff users will be reassigned', async (_actorName: string) => {
	const confirmationText = await actorInTheSpotlight().answer(DeleteConfirmationText());
	if (!/reassigned/i.test(confirmationText) || !/default role/i.test(confirmationText)) {
		throw new Error(`Expected the delete confirmation to explain reassignment to the matching default role, but got: "${confirmationText}"`);
	}
});

Then('the staff user {string} should have the staff role {string}', async (staffUserDisplayName: string, roleName: string) => {
	const assignedRole = await actorInTheSpotlight().answer(StaffUserAssignedRole(staffUserDisplayName, roleName));
	if (assignedRole !== roleName) {
		throw new Error(`Expected staff user "${staffUserDisplayName}" to have the staff role "${roleName}", but got "${assignedRole || 'none'}"`);
	}
});

Then('the staff role {string} should have the permission {string} granted', async (roleName: string, permissionKey: string) => {
	const granted = await actorInTheSpotlight().answer(StaffRolePermissionGranted(roleName, permissionKey));
	if (!granted) {
		throw new Error(`Expected staff role "${roleName}" to have the permission "${permissionKey}" granted`);
	}
});

Then('{word} should see a staff role error containing {string}', async (_actorName: string, expectedFragment: string) => {
	await actorInTheSpotlight().answer(StaffRoleErrorContaining(expectedFragment));
});

Then('{word} should see a staff role validation error for {string}', async (_actorName: string, fieldName: string) => {
	await actorInTheSpotlight().answer(StaffRoleValidationErrorFor(fieldName));
});

Then('no additional staff role should be created', async () => {
	const actor = actorInTheSpotlight();
	const baseline = await actor.answer(BaselineStaffRoleCount());
	const currentCount = await actor.answer(CurrentStaffRoleCount());
	if (currentCount !== baseline) {
		throw new Error(`Expected no additional staff role to be created, but the role count changed from ${baseline} to ${currentCount}`);
	}
});

AfterAll(async () => {
	await closeStaffPortalSessions();
});
