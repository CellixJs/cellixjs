import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { type MutationStatus, STAFF_ROLE_BY_ID_QUERY, STAFF_ROLE_CREATE_MUTATION, type StaffRoleResult, toPermissionsInput } from '../graphql/staff-role-operations.ts';

/** Staff role details accepted by the API creation flow. */
interface CreateStaffRoleDetails {
	roleName: string;
	enterpriseAppRole?: string | undefined;
	permissions?: Record<string, boolean> | undefined;
}

/** Handler that performs staff role creation for an API actor. */
type CreateStaffRoleHandler = (actor: Actor, details: CreateStaffRoleDetails) => Promise<StaffRoleResult>;

/**
 * Serenity ability that creates staff roles through the API verification server.
 * Throws when the mutation reports a validation or authorization failure.
 */
export class CreateStaffRole extends Ability {
	constructor(private readonly handler: CreateStaffRoleHandler) {
		super();
	}

	static using(handler: CreateStaffRoleHandler): CreateStaffRole {
		return new CreateStaffRole(handler);
	}

	async performAs(actor: Actor, details: CreateStaffRoleDetails): Promise<StaffRoleResult> {
		return await this.handler(actor, details);
	}
}

export function createStaffRoleAbility(): CreateStaffRole {
	return CreateStaffRole.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(STAFF_ROLE_CREATE_MUTATION, {
			input: {
				roleName: details.roleName,
				enterpriseAppRole: details.enterpriseAppRole ?? null,
				permissions: details.permissions ? toPermissionsInput(details.permissions) : null,
			},
		});

		const mutationResult = response.data['staffRoleCreate'] as { status: MutationStatus; staffRole: StaffRoleResult | null } | undefined;
		if (mutationResult?.status?.success !== true) {
			throw new Error(String(mutationResult?.status?.errorMessage ?? 'Failed to create staff role'));
		}

		const staffRoleId = mutationResult.staffRole?.id;
		if (!staffRoleId) {
			throw new Error('API staffRoleCreate reported success but returned no staff role id');
		}

		const persistedResponse = await graphql.execute(STAFF_ROLE_BY_ID_QUERY, { id: staffRoleId });
		const persistedRole = persistedResponse.data['staffRoleById'] as StaffRoleResult | null;
		if (!persistedRole) {
			throw new Error(`Staff role ${staffRoleId} was not found on re-query; API backend did not persist the staff role`);
		}
		if (persistedRole.roleName !== details.roleName) {
			throw new Error(`Re-queried staff role name "${persistedRole.roleName}" does not match created name "${details.roleName}"`);
		}

		return persistedRole;
	});
}
