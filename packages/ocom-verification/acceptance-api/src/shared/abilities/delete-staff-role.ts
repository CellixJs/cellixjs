import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { type MutationStatus, STAFF_ROLE_DELETE_MUTATION } from '../graphql/staff-role-operations.ts';

/** Handler that performs a staff role deletion for an API actor. */
type DeleteStaffRoleHandler = (actor: Actor, roleId: string) => Promise<void>;

/**
 * Serenity ability that deletes staff roles through the API verification server.
 * Throws when the mutation reports a validation or authorization failure.
 */
export class DeleteStaffRole extends Ability {
	constructor(private readonly handler: DeleteStaffRoleHandler) {
		super();
	}

	static using(handler: DeleteStaffRoleHandler): DeleteStaffRole {
		return new DeleteStaffRole(handler);
	}

	async performAs(actor: Actor, roleId: string): Promise<void> {
		await this.handler(actor, roleId);
	}
}

export function deleteStaffRoleAbility(): DeleteStaffRole {
	return DeleteStaffRole.using(async (actor, roleId) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(STAFF_ROLE_DELETE_MUTATION, {
			input: { id: roleId },
		});

		const mutationResult = response.data['staffRoleDelete'] as { status: MutationStatus } | undefined;
		if (mutationResult?.status?.success !== true) {
			throw new Error(String(mutationResult?.status?.errorMessage ?? 'Failed to delete staff role'));
		}
	});
}
