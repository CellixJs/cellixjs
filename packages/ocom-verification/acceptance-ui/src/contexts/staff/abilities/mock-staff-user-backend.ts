import type { MockedResponse } from '@apollo/client/testing';
import { CurrentStaffUserDocument, StaffRolesForSelectDocument, StaffUserAssignRoleDocument, StaffUserDetailDocument, StaffUsersListDocument } from '../../../../../../ocom/ui-staff-route-user-management/src/generated.tsx';

interface MockStaffUser {
	id: string;
	displayName: string;
	email: string;
	roleName: string | null;
	enterpriseAppRole: string | null;
	createdAt: string;
}

interface MockStaffRole {
	id: string;
	roleName: string;
	enterpriseAppRole: string;
}

const roleCatalog: MockStaffRole[] = [
	{ id: 'role-finance', roleName: 'finance', enterpriseAppRole: 'Staff.Finance' },
	{ id: 'role-service-line-owner', roleName: 'service line owner', enterpriseAppRole: 'Staff.ServiceLineOwner' },
	{ id: 'role-tech-admin', roleName: 'tech admin', enterpriseAppRole: 'Staff.TechAdmin' },
	{ id: 'role-case-manager', roleName: 'case manager', enterpriseAppRole: 'Staff.CaseManager' },
];

let uiStaffUsers: MockStaffUser[] = [];
let currentViewer: MockStaffUser | undefined;

const toId = (value: string): string =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');

const toEnterpriseAppRole = (roleName: string | null): string | null => {
	if (!roleName) {
		return null;
	}
	const role = roleCatalog.find((candidate) => candidate.roleName === roleName);
	return role?.enterpriseAppRole ?? `Staff.${roleName.replaceAll(' ', '')}`;
};

const createStaffUser = (displayName: string, roleName: string | null = null): MockStaffUser => ({
	id: toId(displayName),
	displayName,
	email: `${toId(displayName)}@example.com`,
	roleName,
	enterpriseAppRole: toEnterpriseAppRole(roleName),
	createdAt: new Date().toISOString(),
});

export function resetStaffUserUiState(): void {
	uiStaffUsers = [];
	currentViewer = undefined;
}

export function setStaffUserUiState(userName: string, roleName: string | null = null): void {
	const existing = uiStaffUsers.find((candidate) => candidate.displayName.toLowerCase() === userName.toLowerCase());
	if (existing) {
		existing.roleName = roleName;
		existing.enterpriseAppRole = toEnterpriseAppRole(roleName);
		return;
	}
	const user = createStaffUser(userName, roleName);
	uiStaffUsers.push(user);
	if (!currentViewer) {
		currentViewer = user;
	}
}

export function setCurrentStaffUser(userName: string, roleName: string | null = null): void {
	const existing = uiStaffUsers.find((candidate) => candidate.displayName.toLowerCase() === userName.toLowerCase());
	if (existing) {
		existing.roleName = roleName;
		existing.enterpriseAppRole = toEnterpriseAppRole(roleName);
		currentViewer = existing;
		return;
	}
	currentViewer = createStaffUser(userName, roleName);
	uiStaffUsers.push(currentViewer);
}

export const buildStaffUserMocks = (): MockedResponse[] => [
	{
		request: { query: StaffUsersListDocument },
		result: {
			data: {
				staffUsers: uiStaffUsers.map((user) => ({
					__typename: 'StaffUser' as const,
					id: user.id,
					displayName: user.displayName,
					email: user.email,
					role: user.roleName ? { __typename: 'StaffUserRole' as const, id: `${user.id}-role`, roleName: user.roleName, enterpriseAppRole: user.enterpriseAppRole } : null,
					createdAt: user.createdAt,
				})),
			},
		},
	},
	{
		request: { query: StaffUserDetailDocument },
		variableMatcher: (variables: { id?: string }) => Boolean(variables.id),
		result: (variables: { id?: string }) => {
			const user = uiStaffUsers.find((candidate) => candidate.id === variables.id || candidate.displayName.toLowerCase() === variables.id?.toLowerCase());
			return {
				data: {
					staffUserById: user
						? {
								__typename: 'StaffUser' as const,
								id: user.id,
								displayName: user.displayName,
								email: user.email,
								role: user.roleName ? { __typename: 'StaffUserRole' as const, id: `${user.id}-role`, roleName: user.roleName, enterpriseAppRole: user.enterpriseAppRole } : null,
								createdAt: user.createdAt,
								activityLog: [],
							}
						: null,
				},
			};
		},
	},
	{
		request: { query: CurrentStaffUserDocument },
		result: {
			data: {
				currentStaffUserAndCreateIfNotExists: currentViewer
					? {
							__typename: 'StaffUser' as const,
							id: currentViewer.id,
							displayName: currentViewer.displayName,
							email: currentViewer.email,
							role: currentViewer.roleName ? { __typename: 'StaffUserRole' as const, id: `${currentViewer.id}-role`, roleName: currentViewer.roleName, enterpriseAppRole: currentViewer.enterpriseAppRole } : null,
							createdAt: currentViewer.createdAt,
						}
					: null,
			},
		},
	},
	{
		request: { query: StaffRolesForSelectDocument },
		result: {
			data: {
				staffRoles: roleCatalog.map((role) => ({
					__typename: 'StaffRole' as const,
					id: role.id,
					roleName: role.roleName,
					enterpriseAppRole: role.enterpriseAppRole,
				})),
			},
		},
	},
	{
		request: { query: StaffUserAssignRoleDocument },
		variableMatcher: () => true,
		result: (variables: { input?: { staffUserId?: string; roleId?: string } }) => {
			const staffUserId = variables.input?.staffUserId;
			const roleId = variables.input?.roleId;
			const role = roleCatalog.find((candidate) => candidate.id === roleId);
			const user = uiStaffUsers.find((candidate) => candidate.id === staffUserId || candidate.displayName.toLowerCase() === staffUserId?.toLowerCase());
			if (!role || !user) {
				return {
					data: {
						staffUserAssignRole: {
							__typename: 'StaffUserAssignRoleResult' as const,
							status: {
								__typename: 'MutationStatus' as const,
								success: false,
								errorMessage: 'Staff user or role not found',
							},
						},
					},
				};
			}
			user.roleName = role.roleName;
			user.enterpriseAppRole = role.enterpriseAppRole;
			if (currentViewer && (currentViewer.id === user.id || currentViewer.displayName.toLowerCase() === user.displayName.toLowerCase())) {
				currentViewer.roleName = role.roleName;
				currentViewer.enterpriseAppRole = role.enterpriseAppRole;
			}
			return {
				data: {
					staffUserAssignRole: {
						__typename: 'StaffUserAssignRoleResult' as const,
						status: {
							__typename: 'MutationStatus' as const,
							success: true,
							errorMessage: null,
						},
					},
				},
			};
		},
	},
];
