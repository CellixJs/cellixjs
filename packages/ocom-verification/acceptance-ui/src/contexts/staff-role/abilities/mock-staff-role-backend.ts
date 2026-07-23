import type { MockedResponse } from '@apollo/client/testing';
import { DEFAULT_STAFF_ROLE_NAMES } from '@ocom-verification/verification-shared/test-data';
import { StaffRoleByIdDocument, StaffRoleCreateDocument, StaffRolesListDocument, StaffRoleUpdateDocument } from '../../../../../../ocom/ui-staff-route-user-management/src/generated.tsx';
import type { StaffAuth } from '../../../../../../ocom/ui-staff-shared/src/staff-route-shell.tsx';

/** Business roles supported by the staff portal UI acceptance flows. */
type StaffBusinessRole = 'finance' | 'tech admin' | 'service line owner' | 'case manager';

const DEFAULT_ENTERPRISE_APP_ROLE = 'Staff.CaseManager';

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

/** Outcome of the last mocked staff-role mutation. */
export interface MockMutationResult {
	success: boolean;
	errorMessage?: string | null;
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
let currentAuthRole: StaffBusinessRole = 'tech admin';
// When set, overrides the business-role auth with fine-grained permissions.
let currentCustomAuth: StaffAuth | undefined;
let lastMutation: MockMutationResult | undefined;
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
	lastMutation = undefined;
	currentPath = '/';
	currentAuthRole = businessRole;
	currentCustomAuth = undefined;
	for (const roleName of DEFAULT_STAFF_ROLE_NAMES) {
		addRole(roleName, `Staff.${roleName.replace('Default ', '').replaceAll(' ', '')}`);
	}
}

/** Overrides the business-role auth with a custom fine-grained StaffAuth. */
export function setScopedStaffAuth(staffAuth: StaffAuth): void {
	currentCustomAuth = staffAuth;
}

/** The StaffAuth the rendered staff-role screens should observe. */
export function currentStaffAuth(): StaffAuth {
	return currentCustomAuth ?? staffAuthByRole[currentAuthRole];
}

/** Adds a staff role to the mocked backend when it is not present yet. */
export function ensureMockStaffRole(roleName: string, enterpriseAppRole: string = DEFAULT_ENTERPRISE_APP_ROLE): void {
	if (!uiRoles.some((candidate) => candidate.roleName === roleName)) {
		addRole(roleName, enterpriseAppRole);
	}
}

/** Finds a staff role in the mocked backend by role name. */
export function findMockStaffRoleByName(roleName: string): { id: string; roleName: string } | undefined {
	return uiRoles.find((candidate) => candidate.roleName === roleName);
}

/** Number of staff roles currently held by the mocked backend. */
export function mockStaffRoleCount(): number {
	return uiRoles.length;
}

/** Outcome of the last mocked staff-role mutation, if any was performed. */
export function lastStaffRoleMutation(): MockMutationResult | undefined {
	return lastMutation;
}

/** Records the router path the rendered screen navigated to. */
export function recordCurrentMockPath(path: string): void {
	currentPath = path;
}

/** The router path last recorded by the rendered screen. */
export function currentMockPath(): string {
	return currentPath;
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

/** Builds the dynamic Apollo mocks backing the staff-role screens. */
export const buildStaffRoleMocks = (): MockedResponse[] => [
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
