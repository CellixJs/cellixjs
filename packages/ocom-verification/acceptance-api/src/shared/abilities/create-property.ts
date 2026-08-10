import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { PROPERTY_BY_ID_QUERY, PROPERTY_CREATE_MUTATION, type PropertyMutationResult, type PropertyResult } from '../graphql/property-operations.ts';

/** Property details accepted by the API creation flow. */
interface CreatePropertyDetails {
	propertyName: string;
}

/** Handler that performs property creation for an API actor. */
type CreatePropertyHandler = (actor: Actor, details: CreatePropertyDetails) => Promise<PropertyResult>;

/**
 * Serenity ability that creates properties through the API verification server.
 * Throws when the mutation reports a validation or authorization failure.
 */
export class CreateProperty extends Ability {
	constructor(private readonly handler: CreatePropertyHandler) {
		super();
	}

	static using(handler: CreatePropertyHandler): CreateProperty {
		return new CreateProperty(handler);
	}

	async performAs(actor: Actor, details: CreatePropertyDetails): Promise<PropertyResult> {
		return await this.handler(actor, details);
	}
}

export function createPropertyAbility(): CreateProperty {
	return CreateProperty.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(PROPERTY_CREATE_MUTATION, {
			input: { propertyName: details.propertyName },
		});

		const mutationResult = response.data['propertyCreate'] as PropertyMutationResult | undefined;
		if (mutationResult?.status?.success !== true) {
			throw new Error(String(mutationResult?.status?.errorMessage ?? 'Failed to create property'));
		}

		const propertyId = mutationResult.property?.id;
		if (!propertyId) {
			throw new Error('API propertyCreate reported success but returned no property id');
		}

		const persistedResponse = await graphql.execute(PROPERTY_BY_ID_QUERY, { id: propertyId });
		const persistedProperty = persistedResponse.data['property'] as PropertyResult | null;
		if (!persistedProperty) {
			throw new Error(`Property ${propertyId} was not found on re-query; API backend did not persist the property`);
		}
		if (persistedProperty.propertyName !== details.propertyName) {
			throw new Error(`Re-queried property name "${persistedProperty.propertyName}" does not match created name "${details.propertyName}"`);
		}

		return persistedProperty;
	});
}
