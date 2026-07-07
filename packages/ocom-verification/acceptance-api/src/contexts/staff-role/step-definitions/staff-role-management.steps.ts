import { ActorName } from '@cellix/serenity-framework/cucumber/actor-name';
import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { setActorToken } from '../../../shared/abilities/actor-auth.ts';
import {
	assignStaffRole,
	createStaffRole,
	findStaffRoleByName,
	getStaffRoleById,
	listStaffRoles,
	listStaffUsers,
	type MutationStatus,
	STAFF_ROLE_PERMISSION_GROUP_BY_KEY,
	type StaffRolePermissionGroupName,
	updateStaffRole,
} from '../support/staff-role-graphql.ts';

const DEFAULT_STAFF_ROLE_NAMES = ['Default Case Manager', 'Default Service Line Owner', 'Default Finance', 'Default Tech Admin'];

interface StaffRoleScenarioState {
	lastActorName: string;
	lastStatus: MutationStatus | undefined;
	lastError: string | undefined;
	listedRoleNames: string[] | undefined;
	viewedRole: { roleName: string; enterpriseAppRole: string } | undefined;
	baselineRoleCount: number | undefined;
}

const state: StaffRoleScenarioState = {
	lastActorName: 'Alice',
	lastStatus: undefined,
	lastError: undefined,
	listedRoleNames: undefined,
	viewedRole: undefined,
	baselineRoleCount: undefined,
};

function resetState(actorName: string): void {
	state.lastActorName = actorName;
	state.lastStatus = undefined;
	state.lastError = undefined;
	state.listedRoleNames = undefined;
	state.viewedRole = undefined;
	state.baselineRoleCount = undefined;
}

function recordOutcome(status: MutationStatus): void {
	state.lastStatus = status;
	state.lastError = status.success ? undefined : (status.errorMessage ?? 'Unknown error');
}

function currentActor(actorName?: string) {
	const resolved = actorName ? ActorName.resolve(actorName, { defaultName: state.lastActorName }) : state.lastActorName;
	state.lastActorName = resolved;
	return actorCalled(resolved);
}

async function requireRoleByName(actorName: string, roleName: string) {
	const actor = currentActor(actorName);
	const role = await findStaffRoleByName(actor, roleName);
	if (!role) {
		throw new Error(`Staff role "${roleName}" was not found`);
	}
	return role;
}

Given('{word} is not authenticated', (actorName: string) => {
	resetState(actorName);
	setActorToken(actorName, null);
	actorCalled(actorName);
});

Given('a staff role named {string} exists', async (roleName: string) => {
	const actor = currentActor();
	const existing = await findStaffRoleByName(actor, roleName);
	if (!existing) {
		const { status } = await createStaffRole(actor, { roleName, enterpriseAppRole: 'Staff.CaseManager' });
		if (!status.success) {
			throw new Error(`Could not set up staff role "${roleName}": ${status.errorMessage}`);
		}
	}
});

When('{word} views the staff roles list', async (actorName: string) => {
	const actor = currentActor(actorName);
	const roles = await listStaffRoles(actor);
	state.listedRoleNames = roles.map((role) => role.roleName);
});

When('{word} attempts to view the staff roles list', async (actorName: string) => {
	const actor = currentActor(actorName);
	try {
		const roles = await listStaffRoles(actor);
		state.listedRoleNames = roles.map((role) => role.roleName);
		state.lastError = undefined;
	} catch (error) {
		state.lastError = error instanceof Error ? error.message : String(error);
	}
});

When('{word} views the details of the staff role {string}', async (actorName: string, roleName: string) => {
	const role = await requireRoleByName(actorName, roleName);
	const details = await getStaffRoleById(currentActor(), role.id);
	if (!details) {
		throw new Error(`Staff role "${roleName}" (${role.id}) could not be retrieved by id`);
	}
	state.viewedRole = { roleName: details.roleName, enterpriseAppRole: details.enterpriseAppRole };
});

When('{word} creates a staff role with:', async (actorName: string, dataTable: DataTable) => {
	const actor = currentActor(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<{ roleName: string; enterpriseAppRole?: string }>();
	recordOutcome((await createStaffRole(actor, { roleName: details.roleName, enterpriseAppRole: details.enterpriseAppRole })).status);
});

When('{word} attempts to create a staff role with:', async (actorName: string, dataTable: DataTable) => {
	const actor = currentActor(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<{ roleName?: string; enterpriseAppRole?: string }>();
	state.baselineRoleCount = (await listStaffRoles(actor)).length;
	recordOutcome((await createStaffRole(actor, { roleName: details.roleName ?? '', enterpriseAppRole: details.enterpriseAppRole })).status);
});

When('{word} creates a staff role named {string} with permissions:', async (actorName: string, roleName: string, dataTable: DataTable) => {
	const actor = currentActor(actorName);
	const flatPermissions = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const permissions = Object.fromEntries(Object.entries(flatPermissions).map(([key, value]) => [key, value === 'true']));
	recordOutcome((await createStaffRole(actor, { roleName, enterpriseAppRole: 'Staff.CaseManager', permissions })).status);
});

When('{word} renames the staff role {string} to {string}', async (actorName: string, currentName: string, newName: string) => {
	const role = await requireRoleByName(actorName, currentName);
	recordOutcome((await updateStaffRole(currentActor(), { id: role.id, roleName: newName, enterpriseAppRole: role.enterpriseAppRole })).status);
});

When('{word} grants the permission {string} to the staff role {string}', async (actorName: string, permissionKey: string, roleName: string) => {
	const role = await requireRoleByName(actorName, roleName);
	recordOutcome(
		(
			await updateStaffRole(currentActor(), {
				id: role.id,
				roleName: role.roleName,
				enterpriseAppRole: role.enterpriseAppRole,
				permissions: { [permissionKey]: true },
			})
		).status,
	);
});

When('{word} assigns the staff role {string} to the staff user {string}', async (actorName: string, roleName: string, staffUserDisplayName: string) => {
	const role = await requireRoleByName(actorName, roleName);
	const actor = currentActor();
	const staffUsers = await listStaffUsers(actor);
	const staffUser = staffUsers.find((user) => user.displayName === staffUserDisplayName);
	if (!staffUser) {
		throw new Error(`Staff user "${staffUserDisplayName}" was not found`);
	}
	recordOutcome((await assignStaffRole(actor, staffUser.id, role.id)).status);
});

Then('the staff roles list should include the default staff roles', () => {
	const listed = state.listedRoleNames;
	if (!listed) {
		throw new Error('No staff roles list was retrieved. Did the actor view the staff roles list first?');
	}
	const missing = DEFAULT_STAFF_ROLE_NAMES.filter((name) => !listed.includes(name));
	if (missing.length > 0) {
		throw new Error(`Expected default staff roles [${missing.join(', ')}] to be listed, but got: [${listed.join(', ')}]`);
	}
});

Then('the staff roles list should include {string}', async (roleName: string) => {
	const roles = await listStaffRoles(currentActor());
	const names = roles.map((role) => role.roleName);
	if (!names.includes(roleName)) {
		throw new Error(`Expected staff roles list to include "${roleName}", but got: [${names.join(', ')}]`);
	}
});

Then('she should see the staff role name {string}', (expectedName: string) => {
	if (state.viewedRole?.roleName !== expectedName) {
		throw new Error(`Expected staff role name "${expectedName}", but got "${state.viewedRole?.roleName}"`);
	}
});

Then('she should see the enterprise app role {string}', (expectedEnterpriseAppRole: string) => {
	if (state.viewedRole?.enterpriseAppRole !== expectedEnterpriseAppRole) {
		throw new Error(`Expected enterprise app role "${expectedEnterpriseAppRole}", but got "${state.viewedRole?.enterpriseAppRole}"`);
	}
});

Then('the staff role should be created successfully', () => {
	if (state.lastStatus?.success !== true) {
		throw new Error(`Expected staff role creation to succeed, but it failed: ${state.lastStatus?.errorMessage ?? 'no mutation was performed'}`);
	}
});

Then('the staff role should be updated successfully', () => {
	if (state.lastStatus?.success !== true) {
		throw new Error(`Expected staff role update to succeed, but it failed: ${state.lastStatus?.errorMessage ?? 'no mutation was performed'}`);
	}
});

Then('the staff role {string} should have the permission {string} granted', async (roleName: string, permissionKey: string) => {
	const role = await findStaffRoleByName(currentActor(), roleName);
	if (!role) {
		throw new Error(`Staff role "${roleName}" was not found`);
	}
	const group: StaffRolePermissionGroupName | undefined = STAFF_ROLE_PERMISSION_GROUP_BY_KEY[permissionKey];
	if (!group) {
		throw new Error(`Unknown staff role permission "${permissionKey}"`);
	}
	if (role.permissions[group]?.[permissionKey] !== true) {
		throw new Error(`Expected staff role "${roleName}" to have permission "${permissionKey}" granted, but it is not`);
	}
});

Then('the staff user {string} should have the staff role {string}', async (staffUserDisplayName: string, roleName: string) => {
	const staffUsers = await listStaffUsers(currentActor());
	const staffUser = staffUsers.find((user) => user.displayName === staffUserDisplayName);
	if (!staffUser) {
		throw new Error(`Staff user "${staffUserDisplayName}" was not found`);
	}
	if (staffUser.role?.roleName !== roleName) {
		throw new Error(`Expected staff user "${staffUserDisplayName}" to have role "${roleName}", but got "${staffUser.role?.roleName ?? 'none'}"`);
	}
});

Then('she should see a staff role error containing {string}', (expectedFragment: string) => {
	if (!state.lastError) {
		throw new Error(`Expected a staff role error containing "${expectedFragment}", but no error was captured`);
	}
	if (!state.lastError.toLowerCase().includes(expectedFragment.toLowerCase())) {
		throw new Error(`Expected staff role error to contain "${expectedFragment}", but got: "${state.lastError}"`);
	}
});

Then('she should see a staff role validation error for {string}', (fieldName: string) => {
	if (!state.lastError) {
		throw new Error(`Expected a validation error for "${fieldName}", but no error was captured`);
	}
	const isFieldMentioned = state.lastError.toLowerCase().includes(fieldName.toLowerCase());
	const isValidationPattern = /cannot be empty|required|missing|invalid|must not be empty|too short|too long|wrong.*type/i.test(state.lastError);
	if (!isFieldMentioned && !isValidationPattern) {
		throw new Error(`Expected a validation error related to "${fieldName}", but got: "${state.lastError}"`);
	}
});

Then('no additional staff role should be created', async () => {
	if (state.baselineRoleCount === undefined) {
		throw new Error('No baseline staff role count was captured. Did the actor attempt to create a staff role first?');
	}
	const roles = await listStaffRoles(currentActor());
	if (roles.length !== state.baselineRoleCount) {
		throw new Error(`Expected staff role count to remain ${state.baselineRoleCount}, but got ${roles.length}`);
	}
});

Then('the staff roles request should be rejected as unauthorized', () => {
	if (!state.lastError) {
		throw new Error('Expected the staff roles request to be rejected, but it succeeded');
	}
	if (!state.lastError.toLowerCase().includes('unauthorized')) {
		throw new Error(`Expected an unauthorized error, but got: "${state.lastError}"`);
	}
});

export { resetState as resetStaffRoleScenarioState };
