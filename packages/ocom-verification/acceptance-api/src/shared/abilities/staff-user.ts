import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import {
	CURRENT_STAFF_USER_QUERY,
	STAFF_ROLE_BY_ID_QUERY,
	STAFF_ROLES_QUERY,
	STAFF_USER_ASSIGN_ROLE_MUTATION,
	STAFF_USER_BY_ID_QUERY,
	STAFF_USERS_QUERY,
	type MutationStatus,
	type StaffRoleResult,
	type StaffUserResult,
} from '../graphql/staff-role-operations.ts';

const canonicalizeRoleName = (name: string): string => {
	const normalized = name.trim();
	if (!normalized) return name;
	const aliasMap: Record<string, string> = {
		'case manager': 'Default Case Manager',
		'default case manager': 'Default Case Manager',
		'service line owner': 'Default Service Line Owner',
		'default service line owner': 'Default Service Line Owner',
		'finance': 'Default Finance',
		'default finance': 'Default Finance',
		'tech admin': 'Default Tech Admin',
		'default tech admin': 'Default Tech Admin',
	};
	return aliasMap[normalized.toLowerCase()] ?? normalized;
};

interface CurrentStaffUserDetails {
	id?: string;
	displayName?: string;
	externalId?: string;
	role?: { id?: string; roleName?: string } | null;
}

interface CurrentStaffUserAbilityResult extends StaffUserResult {}

interface StaffUsersListAbilityResult extends Array<StaffUserResult> {}

type CurrentStaffUserHandler = (actor: Actor) => Promise<CurrentStaffUserAbilityResult>;
type StaffUsersListHandler = (actor: Actor) => Promise<StaffUsersListAbilityResult>;

export class CurrentStaffUser extends Ability {
	constructor(private readonly handler: CurrentStaffUserHandler) {
		super();
	}

	static using(handler: CurrentStaffUserHandler): CurrentStaffUser {
		return new CurrentStaffUser(handler);
	}

	async performAs(actor: Actor): Promise<CurrentStaffUserAbilityResult> {
		return await this.handler(actor);
	}
}

export class StaffUsersList extends Ability {
	constructor(private readonly handler: StaffUsersListHandler) {
		super();
	}

	static using(handler: StaffUsersListHandler): StaffUsersList {
		return new StaffUsersList(handler);
	}

	async performAs(actor: Actor): Promise<StaffUsersListAbilityResult> {
		return await this.handler(actor);
	}
}

export function currentStaffUserAbility(): CurrentStaffUser {
	return CurrentStaffUser.using(async (actor) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(CURRENT_STAFF_USER_QUERY);
		const staffUser = response.data['currentStaffUserAndCreateIfNotExists'] as CurrentStaffUserDetails | null;
		if (!staffUser) {
			throw new Error('API currentStaffUserAndCreateIfNotExists returned no current staff user');
		}
		return {
			id: String(staffUser.id ?? ''),
			displayName: String(staffUser.displayName ?? ''),
			externalId: String(staffUser.externalId ?? ''),
			role: staffUser.role ? { id: String(staffUser.role.id ?? ''), roleName: String(staffUser.role.roleName ?? '') } : null,
		};
	});
}

export function staffUsersListAbility(): StaffUsersList {
	return StaffUsersList.using(async (actor) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(STAFF_USERS_QUERY);
		const staffUsers = response.data['staffUsers'] as StaffUserResult[] | null;
		if (!Array.isArray(staffUsers)) {
			throw new Error('API staffUsers query returned no list');
		}
		return staffUsers;
	});
}

export async function listStaffUsers(actor: Actor): Promise<StaffUserResult[]> {
	const graphql = GraphQLClient.as(actor);
	const response = await graphql.execute(STAFF_USERS_QUERY);
	const staffUsers = response.data['staffUsers'] as StaffUserResult[] | null;
	if (!Array.isArray(staffUsers)) {
		throw new Error('API staffUsers query returned no list');
	}
	return staffUsers;
}

const displayNameMatches = (storedDisplayName: string, requestedName: string): boolean => {
	const requested = requestedName.trim();
	if (!requested) return false;
	const stored = storedDisplayName.trim();
	if (!stored) return false;

	const requestedLower = requested.toLowerCase();
	const storedLower = stored.toLowerCase();
	if (storedLower === requestedLower) return true;
	const storedParts = stored.split(/\s+/).filter(Boolean);
	if (storedParts.length > 0 && storedParts[0]!.toLowerCase() === requestedLower) return true;
	return storedLower.startsWith(`${requestedLower} `);
};

export async function findStaffUserByDisplayName(actor: Actor, displayName: string): Promise<StaffUserResult | undefined> {
	const staffUsers = await listStaffUsers(actor);
	return staffUsers.find((user) => displayNameMatches(user.displayName ?? '', displayName));
}

export async function loadStaffUserById(actor: Actor, id: string): Promise<StaffUserResult> {
	const graphql = GraphQLClient.as(actor);
	const response = await graphql.execute(STAFF_USER_BY_ID_QUERY, { id });
	const staffUser = response.data['staffUserById'] as StaffUserResult | null;
	if (!staffUser) {
		throw new Error(`Staff user ${id} was not found`);
	}
	return staffUser;
}

export async function findStaffRoleByName(actor: Actor, roleName: string): Promise<StaffRoleResult | undefined> {
	const graphql = GraphQLClient.as(actor);
	const response = await graphql.execute(STAFF_ROLES_QUERY);
	const staffRoles = response.data['staffRoles'] as StaffRoleResult[] | null;
	if (!Array.isArray(staffRoles)) {
		throw new Error('API staffRoles query returned no list');
	}
	const expectedRoleName = canonicalizeRoleName(roleName);
	return staffRoles.find((role) => {
		const actualRoleName = canonicalizeRoleName(role.roleName);
		return actualRoleName === expectedRoleName || actualRoleName.toLowerCase() === expectedRoleName.toLowerCase();
	});
}

export async function assignStaffRoleToUser(actor: Actor, details: { staffUserId: string; roleId: string }): Promise<StaffUserResult> {
	const graphql = GraphQLClient.as(actor);
	const response = await graphql.execute(STAFF_USER_ASSIGN_ROLE_MUTATION, {
		input: { staffUserId: details.staffUserId, roleId: details.roleId },
	});

	const mutationResult = response.data['staffUserAssignRole'] as { status: MutationStatus; staffUser: StaffUserResult | null } | undefined;
	if (mutationResult?.status?.success !== true) {
		throw new Error(String(mutationResult?.status?.errorMessage ?? 'Failed to assign staff role'));
	}

	const staffUser = mutationResult.staffUser;
	if (!staffUser) {
		throw new Error('API staffUserAssignRole reported success but returned no staff user');
	}
	return staffUser;
}

export async function fetchStaffUserById(actor: Actor, id: string): Promise<StaffUserResult> {
	return await loadStaffUserById(actor, id);
}

export async function fetchStaffRoleById(actor: Actor, id: string): Promise<StaffRoleResult> {
	const graphql = GraphQLClient.as(actor);
	const response = await graphql.execute(STAFF_ROLE_BY_ID_QUERY, { id });
	const staffRole = response.data['staffRoleById'] as StaffRoleResult | null;
	if (!staffRole) {
		throw new Error(`Staff role ${id} was not found`);
	}
	return staffRole;
}
