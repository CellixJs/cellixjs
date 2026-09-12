import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { PROPERTY_BY_ID_QUERY, PROPERTY_UPDATE_MUTATION, type PropertyListingDetailInput, type PropertyMutationResult, type PropertyResult } from '../graphql/property-operations.ts';
import { PropertyPostCommitProbeError } from './property-post-commit-probe-error.ts';

/** Property fields accepted by the API update flow. */
export interface UpdatePropertyDetails {
	id: string;
	propertyName?: string | undefined;
	propertyType?: string | null | undefined;
	tags?: string[] | undefined;
	listingDetail?: PropertyListingDetailInput | undefined;
}

/** Handler that performs a property update for an API actor. */
type UpdatePropertyHandler = (actor: Actor, details: UpdatePropertyDetails) => Promise<PropertyResult>;

/**
 * Serenity ability that updates properties through the API verification server.
 * Throws when the mutation reports a validation or authorization failure.
 */
export class UpdateProperty extends Ability {
	constructor(private readonly handler: UpdatePropertyHandler) {
		super();
	}

	static using(handler: UpdatePropertyHandler): UpdateProperty {
		return new UpdateProperty(handler);
	}

	async performAs(actor: Actor, details: UpdatePropertyDetails): Promise<PropertyResult> {
		return await this.handler(actor, details);
	}
}

export function updatePropertyAbility(): UpdateProperty {
	return UpdateProperty.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(PROPERTY_UPDATE_MUTATION, {
			input: {
				id: details.id,
				// undefined means "leave unchanged" and is omitted; null is an explicit clear.
				...(details.propertyName !== undefined ? { propertyName: details.propertyName } : {}),
				...(details.propertyType !== undefined ? { propertyType: details.propertyType } : {}),
				...(details.tags !== undefined ? { tags: details.tags } : {}),
				...(details.listingDetail !== undefined ? { listingDetail: details.listingDetail } : {}),
			},
		});

		const mutationResult = response.data['propertyUpdate'] as PropertyMutationResult | undefined;
		if (mutationResult?.status?.success !== true) {
			throw new Error(String(mutationResult?.status?.errorMessage ?? 'Failed to update property'));
		}

		// Past this point the mutation committed: verification failures are
		// reported as probe errors so rejection assertions never mistake them
		// for the mutation being refused.
		let persistedProperty: PropertyResult | null;
		try {
			const persistedResponse = await graphql.execute(PROPERTY_BY_ID_QUERY, { id: details.id });
			persistedProperty = persistedResponse.data['property'] as PropertyResult | null;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new PropertyPostCommitProbeError(`propertyUpdate reported success for property ${details.id} but the persistence re-query failed: ${message}`);
		}
		if (!persistedProperty) {
			throw new PropertyPostCommitProbeError(`Property ${details.id} was not found on re-query; API backend did not persist the update`);
		}

		return persistedProperty;
	});
}
