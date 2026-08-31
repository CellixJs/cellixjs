import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { PROPERTY_DELETE_MUTATION, type PropertyMutationResult } from '../graphql/property-operations.ts';

/** Handler that performs a property (soft) delete for an API actor. */
type DeletePropertyHandler = (actor: Actor, propertyId: string) => Promise<void>;

/**
 * Serenity ability that soft-deletes properties through the API verification server.
 * Throws when the mutation reports a validation or authorization failure.
 */
export class DeleteProperty extends Ability {
	constructor(private readonly handler: DeletePropertyHandler) {
		super();
	}

	static using(handler: DeletePropertyHandler): DeleteProperty {
		return new DeleteProperty(handler);
	}

	async performAs(actor: Actor, propertyId: string): Promise<void> {
		await this.handler(actor, propertyId);
	}
}

export function deletePropertyAbility(): DeleteProperty {
	return DeleteProperty.using(async (actor, propertyId) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(PROPERTY_DELETE_MUTATION, {
			input: { id: propertyId },
		});

		const mutationResult = response.data['propertyDelete'] as PropertyMutationResult | undefined;
		if (mutationResult?.status?.success !== true) {
			throw new Error(String(mutationResult?.status?.errorMessage ?? 'Failed to delete property'));
		}
	});
}
