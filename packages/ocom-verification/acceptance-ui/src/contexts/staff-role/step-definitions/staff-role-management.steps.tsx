import type { MockedResponse } from '@apollo/client/testing';
import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { Render, RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { StaffRoleFormPage, StaffRolesListPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import { act } from '@testing-library/react';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { StaffRoleByIdDocument, StaffRoleCreateDocument, StaffRolesListDocument, StaffRoleUpdateDocument } from '../../../../../../ocom/ui-staff-route-user-management/src/generated.tsx';
import { StaffRolesPage } from '../../../../../../ocom/ui-staff-route-user-management/src/pages/staff-roles.tsx';
import type { StaffAuth } from '../../../../../../ocom/ui-staff-shared/src/staff-route-shell.tsx';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import type { StaffUiNotes } from '../../staff/abilities/staff-types.ts';

type StaffBusinessRole = 'finance' | 'tech admin' | 'service line owner' | 'case manager';

const DEFAULT_STAFF_ROLE_NAMES = ['Default Case Manager', 'Default Service Line Owner', 'Default Finance', 'Default Tech Admin'];

interface MockPermissions {
	__typename: 'StaffRolePermissions';
	communityPermissions: {
		__typename: 'StaffRoleCommunityPermissions';
		canManageCommunities: boolean;
		canManageStaffRolesAndPermissions: boolean;
		canManageAllCommunities: boolean;
		canDeleteCommunities: boolean;
		canChangeCommunityOwner: boolean;
		canReIndexSearchCollections: boolean;
	};
	userPermissions: {
		__typename: 'StaffRoleUserPermissions';
		canManageUsers: boolean;
		canAssignStaffRoles: boolean;
		canViewStaffUsers: boolean;
	};
	staffRolePermissions: {
		__typename: 'StaffRoleRolePermissions';
		canViewRoles: boolean;
		canAddRole: boolean;
		canEditRole: boolean;
		canRemoveRole: boolean;
	};
	financePermissions: {
		__typename: 'StaffRoleFinancePermissions';
		canManageFinance: boolean;
		canViewGLBatchSummaries: boolean;
		canViewFinanceConfigs: boolean;
		canCreateFinanceConfigs: boolean;
	};
	techAdminPermissions: {
		__typename: 'StaffRoleTechAdminPermissions';
		canManageTechAdmin: boolean;
		canViewDatabaseExplorer: boolean;
		canViewBlobExplorer: boolean;
		canViewQueueDashboard: boolean;
		canSendQueueMessages: boolean;
	};
}

interface MockStaffRole {
	id: string;
	roleName: string;
	enterpriseAppRole: string;
	createdAt: string;
	updatedAt: string;
	permissions: MockPermissions;
}

const emptyPermissions = (): MockPermissions => ({
	__typename: 'StaffRolePermissions',
	communityPermissions: {
		__typename: 'StaffRoleCommunityPermissions',
		canManageCommunities: false,
		canManageStaffRolesAndPermissions: false,
		canManageAllCommunities: false,
		canDeleteCommunities: false,
		canChangeCommunityOwner: false,
		canReIndexSearchCollections: false,
	},
	userPermissions: {
		__typename: 'StaffRoleUserPermissions',
		canManageUsers: false,
		canAssignStaffRoles: false,
		canViewStaffUsers: false,
	},
	staffRolePermissions: {
		__typename: 'StaffRoleRolePermissions',
		canViewRoles: false,
		canAddRole: false,
		canEditRole: false,
		canRemoveRole: false,
	},
	financePermissions: {
		__typename: 'StaffRoleFinancePermissions',
		canManageFinance: false,
		canViewGLBatchSummaries: false,
		canViewFinanceConfigs: false,
		canCreateFinanceConfigs: false,
	},
	techAdminPermissions: {
		__typename: 'StaffRoleTechAdminPermissions',
		canManageTechAdmin: false,
		canViewDatabaseExplorer: false,
		canViewBlobExplorer: false,
		canViewQueueDashboard: false,
		canSendQueueMessages: false,
	},
});

const staffAuthByRole: Record<StaffBusinessRole, StaffAuth> = {
	'tech admin': {
		name: 'Tech Admin Staff',
		enterpriseAppRole: 'Staff.TechAdmin',
		permissions: {
			canManageStaffRolesAndPermissions: true,
			canManageTechAdmin: true,
			canViewRoles: true,
			canAddRole: true,
			canEditRole: true,
			canRemoveRole: true,
			canManageUsers: true,
			canAssignStaffRoles: true,
			canViewStaffUsers: true,
		},
	},
	'service line owner': { name: 'Service Line Owner Staff', enterpriseAppRole: 'Staff.ServiceLineOwner', permissions: {} },
	finance: { name: 'Finance Staff', enterpriseAppRole: 'Staff.Finance', permissions: { canManageFinance: true } },
	'case manager': { name: 'Case Manager Staff', enterpriseAppRole: 'Staff.CaseManager', permissions: {} },
};

// Mock backend state shared by the dynamic Apollo mocks below.
let uiRoles: MockStaffRole[] = [];
let baselineRoleCount = 0;
let currentAuthRole: StaffBusinessRole = 'tech admin';
// When set, overrides the business-role auth with fine-grained permissions.
let currentCustomAuth: StaffAuth | undefined;
let lastMutation: { success: boolean; errorMessage?: string | null } | undefined;
let currentPath = '/';
let idCounter = 0;

const nextRoleId = (): string => {
	idCounter += 1;
	return idCounter.toString(16).padStart(24, '0');
};

const addRole = (roleName: string, enterpriseAppRole: string): MockStaffRole => {
	const now = new Date().toISOString();
	const role: MockStaffRole = { id: nextRoleId(), roleName, enterpriseAppRole, createdAt: now, updatedAt: now, permissions: emptyPermissions() };
	uiRoles.push(role);
	return role;
};

/**
 * Resets the mocked staff-role backend for a new scenario and records which
 * business role the acting staff user holds. Called from the shared staff
 * authentication Givens in the staff context.
 */
export function resetStaffRoleUiState(businessRole: StaffBusinessRole): void {
	uiRoles = [];
	baselineRoleCount = 0;
	lastMutation = undefined;
	currentPath = '/';
	currentAuthRole = businessRole;
	currentCustomAuth = undefined;
	for (const roleName of DEFAULT_STAFF_ROLE_NAMES) {
		addRole(roleName, `Staff.${roleName.replace('Default ', '').replaceAll(' ', '')}`);
	}
}

const toListFields = (role: MockStaffRole) => ({
	__typename: 'StaffRole' as const,
	id: role.id,
	roleName: role.roleName,
	enterpriseAppRole: role.enterpriseAppRole,
	createdAt: role.createdAt,
	updatedAt: role.updatedAt,
});

const toEditFields = (role: MockStaffRole) => ({
	__typename: 'StaffRole' as const,
	id: role.id,
	roleName: role.roleName,
	enterpriseAppRole: role.enterpriseAppRole,
	permissions: role.permissions,
});

interface StaffRoleMutationInput {
	id?: string;
	roleName?: string;
	enterpriseAppRole?: string | null;
}

const buildMocks = (): MockedResponse[] => [
	{
		request: { query: StaffRolesListDocument },
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: () => ({ data: { staffRoles: uiRoles.map(toListFields) } }),
	},
	{
		request: { query: StaffRoleByIdDocument },
		variableMatcher: () => true,
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: (variables: { id?: string }) => {
			const role = uiRoles.find((candidate) => candidate.id === variables.id);
			return { data: { staffRoleById: role ? toEditFields(role) : null } };
		},
	},
	{
		request: { query: StaffRoleCreateDocument },
		variableMatcher: () => true,
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: (variables: { input?: StaffRoleMutationInput }) => {
			const roleName = variables.input?.roleName ?? '';
			if (uiRoles.some((candidate) => candidate.roleName === roleName)) {
				lastMutation = { success: false, errorMessage: `Staff role with name ${roleName} already exists` };
				return {
					data: {
						staffRoleCreate: {
							__typename: 'StaffRoleMutationResult' as const,
							status: { __typename: 'MutationStatus' as const, success: false, errorMessage: lastMutation.errorMessage },
							staffRole: null,
						},
					},
				};
			}
			const role = addRole(roleName, variables.input?.enterpriseAppRole ?? '');
			lastMutation = { success: true };
			return {
				data: {
					staffRoleCreate: {
						__typename: 'StaffRoleMutationResult' as const,
						status: { __typename: 'MutationStatus' as const, success: true, errorMessage: null },
						staffRole: toListFields(role),
					},
				},
			};
		},
	},
	{
		request: { query: StaffRoleUpdateDocument },
		variableMatcher: () => true,
		maxUsageCount: Number.POSITIVE_INFINITY,
		result: (variables: { input?: StaffRoleMutationInput }) => {
			const role = uiRoles.find((candidate) => candidate.id === variables.input?.id);
			if (!role) {
				lastMutation = { success: false, errorMessage: 'Staff role not found' };
				return {
					data: {
						staffRoleUpdate: {
							__typename: 'StaffRoleMutationResult' as const,
							status: { __typename: 'MutationStatus' as const, success: false, errorMessage: lastMutation.errorMessage },
							staffRole: null,
						},
					},
				};
			}
			role.roleName = variables.input?.roleName ?? role.roleName;
			role.enterpriseAppRole = variables.input?.enterpriseAppRole ?? role.enterpriseAppRole;
			role.updatedAt = new Date().toISOString();
			lastMutation = { success: true };
			return {
				data: {
					staffRoleUpdate: {
						__typename: 'StaffRoleMutationResult' as const,
						status: { __typename: 'MutationStatus' as const, success: true, errorMessage: null },
						staffRole: toEditFields(role),
					},
				},
			};
		},
	},
];

const LocationProbe: React.FC = () => {
	const location = useLocation();
	currentPath = location.pathname;
	return null;
};

async function flushUi(): Promise<void> {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
}

async function waitUntilUi(check: () => Promise<boolean>, message: string, attempts = 200): Promise<void> {
	for (let attempt = 0; attempt < attempts; attempt++) {
		if (await check()) {
			return;
		}
		await flushUi();
	}
	throw new Error(message);
}

const listPageFor = (actor: Actor): StaffRolesListPage => new StaffRolesListPage(new DomPageAdapter(RenderInDom.as(actor).container));
const formPageFor = (actor: Actor): StaffRoleFormPage => new StaffRoleFormPage(new DomPageAdapter(RenderInDom.as(actor).container));

// antd messages portal to document.body, outside the rendered container.
const feedbackPage = (): StaffRoleFormPage => new StaffRoleFormPage(new DomPageAdapter(document.body));

async function renderStaffRolesScreen(actorName: string, initialEntries: string[] = ['/']): Promise<Actor> {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(
		Render.component(React.createElement(React.Fragment, null, React.createElement(LocationProbe), React.createElement(StaffRolesPage)), {
			wrapper: wrapOcomComponent({ mocks: buildMocks(), initialEntries, staffAuth: currentCustomAuth ?? staffAuthByRole[currentAuthRole] }),
		}),
	);
	await flushUi();
	return actor;
}

async function openRolesListAndWait(actorName: string): Promise<Actor> {
	const actor = await renderStaffRolesScreen(actorName);
	const listPage = listPageFor(actor);
	await waitUntilUi(async () => (await listPage.listedRoleNames()).length > 0, 'Expected the staff roles list to render rows');
	return actor;
}

async function openEditFormForRole(actorName: string, roleName: string): Promise<Actor> {
	const actor = await openRolesListAndWait(actorName);
	const listPage = listPageFor(actor);
	await listPage.clickEditForRole(roleName);
	const formPage = formPageFor(actor);
	await waitUntilUi(async () => (await formPage.roleNameValue()) === roleName, `Expected the edit form to load the staff role "${roleName}"`);
	return actor;
}

interface StaffRoleFormInput {
	roleName?: string;
	enterpriseAppRole?: string;
}

async function submitCreateForm(actorName: string, dataTable: DataTable): Promise<void> {
	const { roleName = '', enterpriseAppRole } = GherkinDataTable.from(dataTable).rowsHash<StaffRoleFormInput>();
	baselineRoleCount = uiRoles.length;
	const actor = await openRolesListAndWait(actorName);
	const listPage = listPageFor(actor);
	await listPage.clickCreateRole();
	const formPage = formPageFor(actor);
	await waitUntilUi(() => formPage.roleNameInput.isVisible(), 'Expected the create staff role form to render');
	if (roleName) {
		await formPage.fillRoleName(roleName);
	}
	if (enterpriseAppRole) {
		await formPage.selectEnterpriseAppRole(enterpriseAppRole);
	}
	await formPage.clickSubmit();
	await flushUi();
}

const STAFF_ROLE_PERMISSION_FLAGS = ['canViewRoles', 'canAddRole', 'canEditRole', 'canRemoveRole'] as const;
type StaffRolePermissionFlag = (typeof STAFF_ROLE_PERMISSION_FLAGS)[number];

Given('{word} is an authenticated staff user with only the {string} role permission', (_actorName: string, permissionFlag: string) => {
	if (!STAFF_ROLE_PERMISSION_FLAGS.includes(permissionFlag as StaffRolePermissionFlag)) {
		throw new Error(`Unsupported staff role permission "${permissionFlag}". Expected one of: ${STAFF_ROLE_PERMISSION_FLAGS.join(', ')}`);
	}
	resetStaffRoleUiState('case manager');
	currentCustomAuth = {
		name: 'Scoped Staff',
		enterpriseAppRole: 'Staff.CaseManager',
		permissions: { [permissionFlag]: true },
	};
});

Given('a staff role named {string} exists', (roleName: string) => {
	if (!uiRoles.some((candidate) => candidate.roleName === roleName)) {
		addRole(roleName, 'Staff.CaseManager');
	}
});

When('{word} views the staff roles list', async (actorName: string) => {
	await openRolesListAndWait(actorName);
});

When('{word} views the details of the staff role {string}', async (actorName: string, roleName: string) => {
	await openEditFormForRole(actorName, roleName);
});

When('{word} creates a staff role with:', async (actorName: string, dataTable: DataTable) => {
	await submitCreateForm(actorName, dataTable);
});

When('{word} attempts to create a staff role with:', async (actorName: string, dataTable: DataTable) => {
	await submitCreateForm(actorName, dataTable);
});

When('{word} renames the staff role {string} to {string}', async (actorName: string, currentName: string, newName: string) => {
	const actor = await openEditFormForRole(actorName, currentName);
	const formPage = formPageFor(actor);
	await formPage.fillRoleName(newName);
	await formPage.clickSubmit();
	await flushUi();
});

When('{word} opens the staff roles screen', async (actorName: string) => {
	const actor = await renderStaffRolesScreen(actorName);
	await flushUi();
	await actor.attemptsTo(notes<StaffUiNotes>().set('targetRoute', currentPath));
});

When('{word} opens the edit screen for the staff role {string}', async (actorName: string, roleName: string) => {
	const role = uiRoles.find((candidate) => candidate.roleName === roleName);
	if (!role) {
		throw new Error(`Staff role "${roleName}" is not present in the mocked backend`);
	}
	const actor = await renderStaffRolesScreen(actorName, [`/edit/${role.id}`]);
	await flushUi();
	await actor.attemptsTo(notes<StaffUiNotes>().set('targetRoute', currentPath));
});

Then('the staff roles list should include the default staff roles', async () => {
	const listPage = listPageFor(actorInTheSpotlight());
	const listed = await listPage.listedRoleNames();
	const missing = DEFAULT_STAFF_ROLE_NAMES.filter((name) => !listed.includes(name));
	if (missing.length > 0) {
		throw new Error(`Expected default staff roles [${missing.join(', ')}] to be listed, but got: [${listed.join(', ')}]`);
	}
});

Then('{word} should see the staff role name {string}', async (_actorName: string, expectedName: string) => {
	const formPage = formPageFor(actorInTheSpotlight());
	const value = await formPage.roleNameValue();
	if (value !== expectedName) {
		throw new Error(`Expected the staff role form to show role name "${expectedName}", but got "${value}"`);
	}
});

Then('{word} should see the enterprise app role {string}', async (_actorName: string, expectedRole: string) => {
	const formPage = formPageFor(actorInTheSpotlight());
	const value = await formPage.selectedEnterpriseAppRole();
	if (value !== expectedRole) {
		throw new Error(`Expected the staff role form to show enterprise app role "${expectedRole}", but got "${value}"`);
	}
});

Then('the staff role should be created successfully', async () => {
	await waitUntilUi(() => feedbackPage().successFeedback.isVisible(), 'Expected a success message after creating the staff role');
	if (lastMutation?.success !== true || uiRoles.length !== baselineRoleCount + 1) {
		throw new Error('Expected the staff role create mutation to succeed and persist exactly one new role');
	}
});

Then('the staff role should be updated successfully', async () => {
	await waitUntilUi(() => feedbackPage().successFeedback.isVisible(), 'Expected a success message after updating the staff role');
	if (lastMutation?.success !== true) {
		throw new Error('Expected the staff role update mutation to succeed');
	}
});

Then('the staff roles list should include {string}', async (roleName: string) => {
	const listPage = listPageFor(actorInTheSpotlight());
	await waitUntilUi(() => listPage.hasRoleNamed(roleName), `Expected the staff roles list to include "${roleName}"`);
});

Then('{word} should see a staff role error containing {string}', async (_actorName: string, expectedFragment: string) => {
	await waitUntilUi(async () => {
		const errorFeedback = feedbackPage().errorFeedback;
		if (!(await errorFeedback.isVisible())) {
			return false;
		}
		const text = (await errorFeedback.textContent()) ?? '';
		return text.includes(expectedFragment);
	}, `Expected a staff role error message containing "${expectedFragment}"`);
});

Then('{word} should see a staff role validation error for {string}', async (_actorName: string, fieldName: string) => {
	const formPage = formPageFor(actorInTheSpotlight());
	const expectedPattern = fieldName === 'roleName' ? /role name/i : new RegExp(fieldName, 'i');
	await waitUntilUi(async () => {
		if (!(await formPage.firstValidationError.isVisible())) {
			return false;
		}
		const text = (await formPage.firstValidationError.textContent()) ?? '';
		return expectedPattern.test(text);
	}, `Expected a validation error for "${fieldName}"`);
});

Then('{word} should not see an option to create a staff role', async (_actorName: string) => {
	const listPage = listPageFor(actorInTheSpotlight());
	if (await listPage.createRoleButton.isVisible()) {
		throw new Error('Expected the create staff role action to be hidden, but it is visible');
	}
});

Then('{word} should not see an option to edit a staff role', async (_actorName: string) => {
	const listPage = listPageFor(actorInTheSpotlight());
	if (await listPage.hasAnyEditAction()) {
		throw new Error('Expected no edit action to be rendered for any staff role, but at least one is visible');
	}
});

Then('no additional staff role should be created', () => {
	if (uiRoles.length !== baselineRoleCount) {
		throw new Error(`Expected no additional staff role to be created, but the role count changed from ${baselineRoleCount} to ${uiRoles.length}`);
	}
});
