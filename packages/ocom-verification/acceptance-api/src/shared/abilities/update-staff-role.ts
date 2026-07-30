import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { type MutationStatus, STAFF_ROLE_UPDATE_MUTATION, type StaffRoleResult, toPermissionsInput } from '../graphql/staff-role-operations.ts';

/** Staff role details accepted by the API update flow. */
interface UpdateStaffRoleDetails {
	id: string;
	roleName: string;
	enterpriseAppRole: string;
	permissions?: Record<string, boolean> | undefined;
}

/** Handler that performs a staff role update for an API actor. */
type UpdateStaffRoleHandler = (actor: Actor, details: UpdateStaffRoleDetails) => Promise<StaffRoleResult>;

/**
 * Serenity ability that updates staff roles through the API verification server.
 * Throws when the mutation reports a validation or authorization failure.
 */
export class UpdateStaffRole extends Ability {
	constructor(private readonly handler: UpdateStaffRoleHandler) {
		super();
	}

	static using(handler: UpdateStaffRoleHandler): UpdateStaffRole {
		return new UpdateStaffRole(handler);
	}

	async performAs(actor: Actor, details: UpdateStaffRoleDetails): Promise<StaffRoleResult> {
		return await this.handler(actor, details);
	}
}

export function updateStaffRoleAbility(): UpdateStaffRole {
	return UpdateStaffRole.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(STAFF_ROLE_UPDATE_MUTATION, {
			input: {
				id: details.id,
				roleName: details.roleName,
				enterpriseAppRole: details.enterpriseAppRole,
				permissions: details.permissions ? toPermissionsInput(details.permissions) : null,
			},
		});

		const mutationResult = response.data['staffRoleUpdate'] as { status: MutationStatus; staffRole: StaffRoleResult | null } | undefined;
		if (mutationResult?.status?.success !== true) {
			throw new Error(String(mutationResult?.status?.errorMessage ?? 'Failed to update staff role'));
		}

		const staffRole = mutationResult.staffRole;
		if (!staffRole) {
			throw new Error('API staffRoleUpdate reported success but returned no staff role');
		}

		return staffRole;
	});
}
