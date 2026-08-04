import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { type MutationStatus, STAFF_USER_ASSIGN_ROLE_MUTATION, type StaffUserResult } from '../graphql/staff-role-operations.ts';

/** Assignment details accepted by the API staff-user role assignment flow. */
interface AssignStaffRoleDetails {
	staffUserId: string;
	roleId: string;
}

/** Handler that assigns a staff role to a staff user for an API actor. */
type AssignStaffRoleHandler = (actor: Actor, details: AssignStaffRoleDetails) => Promise<StaffUserResult>;

/**
 * Serenity ability that assigns staff roles to staff users through the API
 * verification server. Throws when the mutation reports a failure.
 */
export class AssignStaffRole extends Ability {
	constructor(private readonly handler: AssignStaffRoleHandler) {
		super();
	}

	static using(handler: AssignStaffRoleHandler): AssignStaffRole {
		return new AssignStaffRole(handler);
	}

	async performAs(actor: Actor, details: AssignStaffRoleDetails): Promise<StaffUserResult> {
		return await this.handler(actor, details);
	}
}

export function assignStaffRoleAbility(): AssignStaffRole {
	return AssignStaffRole.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(STAFF_USER_ASSIGN_ROLE_MUTATION, {
			input: { staffUserId: details.staffUserId, roleId: details.roleId },
		});

		const mutationResult = response.data.staffUserAssignRole as { status: MutationStatus; staffUser: StaffUserResult | null } | undefined;
		if (mutationResult?.status?.success !== true) {
			throw new Error(String(mutationResult?.status?.errorMessage ?? 'Failed to assign staff role'));
		}

		const staffUser = mutationResult.staffUser;
		if (!staffUser) {
			throw new Error('API staffUserAssignRole reported success but returned no staff user');
		}

		return staffUser;
	});
}
