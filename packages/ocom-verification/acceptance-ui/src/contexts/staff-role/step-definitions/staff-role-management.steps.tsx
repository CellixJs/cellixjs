import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { DEFAULT_STAFF_ROLE_NAMES } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import { ensureMockStaffRole, failStaffRoleDeletions, resetStaffRoleUiState, setScopedStaffAuth } from '../abilities/mock-staff-role-backend.ts';
import { BaselineStaffRoleCount, LastStaffRoleMutation, MockedStaffRoleCount } from '../questions/staff-role-outcome.ts';
import {
	AnyEditActionVisible,
	CreateRoleActionVisible,
	DeleteActionVisible,
	DeleteConfirmationText,
	ErrorFeedbackContaining,
	FormEnterpriseAppRole,
	FormRoleNameValue,
	ListedStaffRoleNames,
	StaffRolesListExcludes,
	StaffRolesListIncludes,
	SuccessFeedbackVisible,
	ValidationErrorMatching,
} from '../questions/staff-role-screen.ts';
import { CreateStaffRoleViaForm, RenameStaffRoleViaForm, type StaffRoleFormInput } from '../tasks/create-staff-role.ts';
import { CancelStaffRoleDeletion, DeleteStaffRoleViaForm, StartDeletingStaffRole } from '../tasks/delete-staff-role.ts';
import { OpenStaffRoleEditScreenRecordingRoute, OpenStaffRolesScreenRecordingRoute } from '../tasks/open-staff-role-screens.ts';
import { OpenEditFormForRole, OpenStaffRolesList } from '../tasks/staff-roles-screen.ts';

const STAFF_ROLE_PERMISSION_FLAGS = ['canViewRoles', 'canAddRole', 'canEditRole', 'canRemoveRole'] as const;
type StaffRolePermissionFlag = (typeof STAFF_ROLE_PERMISSION_FLAGS)[number];

Given('{word} is an authenticated staff user with only the {string} role permission', (actorName: string, permissionFlag: string) => {
	if (!STAFF_ROLE_PERMISSION_FLAGS.includes(permissionFlag as StaffRolePermissionFlag)) {
		throw new Error(`Unsupported staff role permission "${permissionFlag}". Expected one of: ${STAFF_ROLE_PERMISSION_FLAGS.join(', ')}`);
	}
	resetStaffRoleUiState('case manager');
	setScopedStaffAuth({
		name: 'Scoped Staff',
		enterpriseAppRole: 'Staff.CaseManager',
		permissions: { [permissionFlag]: true },
	});
	actorCalled(actorName);
});

Given('a staff role named {string} exists', (roleName: string) => {
	ensureMockStaffRole(roleName);
});

Given('the staff role deletion will fail', () => {
	failStaffRoleDeletions();
});

When('{word} views the staff roles list', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(OpenStaffRolesList());
});

When('{word} views the details of the staff role {string}', async (actorName: string, roleName: string) => {
	await actorCalled(actorName).attemptsTo(OpenEditFormForRole(roleName));
});

When('{word} creates a staff role with:', async (actorName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<StaffRoleFormInput>();
	await actorCalled(actorName).attemptsTo(CreateStaffRoleViaForm(details));
});

When('{word} attempts to create a staff role with:', async (actorName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<StaffRoleFormInput>();
	await actorCalled(actorName).attemptsTo(CreateStaffRoleViaForm(details));
});

When('{word} renames the staff role {string} to {string}', async (actorName: string, currentName: string, newName: string) => {
	await actorCalled(actorName).attemptsTo(RenameStaffRoleViaForm(currentName, newName));
});

When('{word} opens the staff roles screen', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(OpenStaffRolesScreenRecordingRoute());
});

When('{word} opens the edit screen for the staff role {string}', async (actorName: string, roleName: string) => {
	await actorCalled(actorName).attemptsTo(OpenStaffRoleEditScreenRecordingRoute(roleName));
});

When('{word} deletes the staff role {string}', async (actorName: string, roleName: string) => {
	await actorCalled(actorName).attemptsTo(DeleteStaffRoleViaForm(roleName));
});

When('{word} attempts to delete the staff role {string}', async (actorName: string, roleName: string) => {
	await actorCalled(actorName).attemptsTo(DeleteStaffRoleViaForm(roleName));
});

When('{word} starts deleting the staff role {string}', async (actorName: string, roleName: string) => {
	await actorCalled(actorName).attemptsTo(StartDeletingStaffRole(roleName));
});

When('{word} cancels the staff role deletion', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(CancelStaffRoleDeletion());
});

Then('the staff roles list should include the default staff roles', async () => {
	const listed = await actorInTheSpotlight().answer(ListedStaffRoleNames());
	const missing = DEFAULT_STAFF_ROLE_NAMES.filter((name) => !listed.includes(name));
	if (missing.length > 0) {
		throw new Error(`Expected default staff roles [${missing.join(', ')}] to be listed, but got: [${listed.join(', ')}]`);
	}
});

Then('{word} should see the staff role name {string}', async (_actorName: string, expectedName: string) => {
	const value = await actorInTheSpotlight().answer(FormRoleNameValue());
	if (value !== expectedName) {
		throw new Error(`Expected the staff role form to show role name "${expectedName}", but got "${value}"`);
	}
});

Then('{word} should see the enterprise app role {string}', async (_actorName: string, expectedRole: string) => {
	const value = await actorInTheSpotlight().answer(FormEnterpriseAppRole());
	if (value !== expectedRole) {
		throw new Error(`Expected the staff role form to show enterprise app role "${expectedRole}", but got "${value}"`);
	}
});

Then('the staff role should be created successfully', async () => {
	const actor = actorInTheSpotlight();
	if (!(await actor.answer(SuccessFeedbackVisible()))) {
		throw new Error('Expected a success message after creating the staff role');
	}
	const mutation = await actor.answer(LastStaffRoleMutation());
	const baselineCount = await actor.answer(BaselineStaffRoleCount());
	const currentCount = await actor.answer(MockedStaffRoleCount());
	if (mutation?.success !== true || baselineCount === undefined || currentCount !== baselineCount + 1) {
		throw new Error('Expected the staff role create mutation to succeed and persist exactly one new role');
	}
});

Then('the staff role should be updated successfully', async () => {
	const actor = actorInTheSpotlight();
	if (!(await actor.answer(SuccessFeedbackVisible()))) {
		throw new Error('Expected a success message after updating the staff role');
	}
	const mutation = await actor.answer(LastStaffRoleMutation());
	if (mutation?.success !== true) {
		throw new Error('Expected the staff role update mutation to succeed');
	}
});

Then('the staff roles list should include {string}', async (roleName: string) => {
	if (!(await actorInTheSpotlight().answer(StaffRolesListIncludes(roleName)))) {
		throw new Error(`Expected the staff roles list to include "${roleName}"`);
	}
});

Then('the staff role should be deleted successfully', async () => {
	const actor = actorInTheSpotlight();
	const mutation = await actor.answer(LastStaffRoleMutation());
	if (mutation?.success !== true) {
		throw new Error(`Expected the staff role delete mutation to succeed, but got: ${mutation?.errorMessage ?? 'no mutation was performed'}`);
	}
});

Then('the staff roles list should not include {string}', async (roleName: string) => {
	if (!(await actorInTheSpotlight().answer(StaffRolesListExcludes(roleName)))) {
		throw new Error(`Expected the staff roles list to no longer include "${roleName}"`);
	}
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

Then('{word} should see a staff role error containing {string}', async (_actorName: string, expectedFragment: string) => {
	if (!(await actorInTheSpotlight().answer(ErrorFeedbackContaining(expectedFragment)))) {
		throw new Error(`Expected a staff role error message containing "${expectedFragment}"`);
	}
});

Then('{word} should see a staff role validation error for {string}', async (_actorName: string, fieldName: string) => {
	const expectedPattern = fieldName === 'roleName' ? /role name/i : new RegExp(fieldName, 'i');
	if (!(await actorInTheSpotlight().answer(ValidationErrorMatching(expectedPattern)))) {
		throw new Error(`Expected a validation error for "${fieldName}"`);
	}
});

Then('{word} should not see an option to create a staff role', async (_actorName: string) => {
	if (await actorInTheSpotlight().answer(CreateRoleActionVisible())) {
		throw new Error('Expected the create staff role action to be hidden, but it is visible');
	}
});

Then('{word} should not see an option to edit a staff role', async (_actorName: string) => {
	if (await actorInTheSpotlight().answer(AnyEditActionVisible())) {
		throw new Error('Expected no edit action to be rendered for any staff role, but at least one is visible');
	}
});

Then('no additional staff role should be created', async () => {
	const actor = actorInTheSpotlight();
	const baselineCount = await actor.answer(BaselineStaffRoleCount());
	if (baselineCount === undefined) {
		throw new Error('No baseline staff role count was recorded. Did the actor attempt to create a staff role first?');
	}
	const currentCount = await actor.answer(MockedStaffRoleCount());
	if (currentCount !== baselineCount) {
		throw new Error(`Expected no additional staff role to be created, but the role count changed from ${baselineCount} to ${currentCount}`);
	}
});
