import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import type { Actor } from '@serenity-js/core';
import { STAFF_ROLE_BY_ID_QUERY, STAFF_ROLE_CREATE_MUTATION, STAFF_ROLE_UPDATE_MUTATION, STAFF_ROLES_QUERY, STAFF_USER_ASSIGN_ROLE_MUTATION, STAFF_USERS_QUERY } from '../../../shared/graphql/staff-role-operations.ts';

export type StaffRolePermissionGroupName = 'communityPermissions' | 'financePermissions' | 'staffRolePermissions' | 'techAdminPermissions' | 'userPermissions';

interface StaffRoleResult {
	id: string;
	roleName: string;
	enterpriseAppRole: string;
	isDefault: boolean;
	permissions: Record<StaffRolePermissionGroupName, Record<string, boolean>>;
}

interface StaffUserResult {
	id: string;
	displayName: string;
	externalId: string;
	role: { id: string; roleName: string } | null;
}

export interface MutationStatus {
	success: boolean;
	errorMessage?: string | null;
}

/** Maps flat permission command keys to their GraphQL permission group. */
export const STAFF_ROLE_PERMISSION_GROUP_BY_KEY: Record<string, StaffRolePermissionGroupName> = {
	canManageCommunities: 'communityPermissions',
	canManageStaffRolesAndPermissions: 'communityPermissions',
	canManageAllCommunities: 'communityPermissions',
	canDeleteCommunities: 'communityPermissions',
	canChangeCommunityOwner: 'communityPermissions',
	canReIndexSearchCollections: 'communityPermissions',
	canManageFinance: 'financePermissions',
	canViewGLBatchSummaries: 'financePermissions',
	canViewFinanceConfigs: 'financePermissions',
	canCreateFinanceConfigs: 'financePermissions',
	canViewRoles: 'staffRolePermissions',
	canAddRole: 'staffRolePermissions',
	canEditRole: 'staffRolePermissions',
	canRemoveRole: 'staffRolePermissions',
	canManageTechAdmin: 'techAdminPermissions',
	canViewDatabaseExplorer: 'techAdminPermissions',
	canViewBlobExplorer: 'techAdminPermissions',
	canViewQueueDashboard: 'techAdminPermissions',
	canSendQueueMessages: 'techAdminPermissions',
	canManageUsers: 'userPermissions',
	canAssignStaffRoles: 'userPermissions',
	canViewStaffUsers: 'userPermissions',
};

/** Convert flat `key -> boolean` pairs into the grouped StaffRole permissions input shape. */
function toPermissionsInput(flatPermissions: Record<string, boolean>): Record<string, Record<string, boolean>> {
	const input: Record<string, Record<string, boolean>> = {};
	for (const [key, value] of Object.entries(flatPermissions)) {
		const group = STAFF_ROLE_PERMISSION_GROUP_BY_KEY[key];
		if (!group) {
			throw new Error(`Unknown staff role permission "${key}"`);
		}
		input[group] = { ...input[group], [key]: value };
	}
	return input;
}

export async function listStaffRoles(actor: Actor): Promise<StaffRoleResult[]> {
	const response = await GraphQLClient.as(actor).execute(STAFF_ROLES_QUERY);
	return response.data['staffRoles'] as StaffRoleResult[];
}

export async function getStaffRoleById(actor: Actor, id: string): Promise<StaffRoleResult | null> {
	const response = await GraphQLClient.as(actor).execute(STAFF_ROLE_BY_ID_QUERY, { id });
	return (response.data['staffRoleById'] as StaffRoleResult | null) ?? null;
}

export async function findStaffRoleByName(actor: Actor, roleName: string): Promise<StaffRoleResult | undefined> {
	const roles = await listStaffRoles(actor);
	return roles.find((role) => role.roleName === roleName);
}

interface StaffRoleCreateRequest {
	roleName: string;
	enterpriseAppRole?: string | undefined;
	permissions?: Record<string, boolean> | undefined;
}

export async function createStaffRole(actor: Actor, request: StaffRoleCreateRequest): Promise<{ status: MutationStatus; staffRole: StaffRoleResult | null }> {
	const response = await GraphQLClient.as(actor).execute(STAFF_ROLE_CREATE_MUTATION, {
		input: {
			roleName: request.roleName,
			enterpriseAppRole: request.enterpriseAppRole ?? null,
			permissions: request.permissions ? toPermissionsInput(request.permissions) : null,
		},
	});
	return response.data['staffRoleCreate'] as { status: MutationStatus; staffRole: StaffRoleResult | null };
}

interface StaffRoleUpdateRequest {
	id: string;
	roleName: string;
	enterpriseAppRole: string;
	permissions?: Record<string, boolean> | undefined;
}

export async function updateStaffRole(actor: Actor, request: StaffRoleUpdateRequest): Promise<{ status: MutationStatus; staffRole: StaffRoleResult | null }> {
	const response = await GraphQLClient.as(actor).execute(STAFF_ROLE_UPDATE_MUTATION, {
		input: {
			id: request.id,
			roleName: request.roleName,
			enterpriseAppRole: request.enterpriseAppRole,
			permissions: request.permissions ? toPermissionsInput(request.permissions) : null,
		},
	});
	return response.data['staffRoleUpdate'] as { status: MutationStatus; staffRole: StaffRoleResult | null };
}

export async function listStaffUsers(actor: Actor): Promise<StaffUserResult[]> {
	const response = await GraphQLClient.as(actor).execute(STAFF_USERS_QUERY);
	return response.data['staffUsers'] as StaffUserResult[];
}

export async function assignStaffRole(actor: Actor, staffUserId: string, roleId: string): Promise<{ status: MutationStatus; staffUser: StaffUserResult | null }> {
	const response = await GraphQLClient.as(actor).execute(STAFF_USER_ASSIGN_ROLE_MUTATION, {
		input: { staffUserId, roleId },
	});
	return response.data['staffUserAssignRole'] as { status: MutationStatus; staffUser: StaffUserResult | null };
}
