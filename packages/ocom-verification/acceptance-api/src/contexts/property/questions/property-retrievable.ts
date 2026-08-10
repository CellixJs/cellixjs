import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { PROPERTY_BY_ID_QUERY, type PropertyResult } from '../../../shared/graphql/property-operations.ts';

const NOT_FOUND_PATTERN = /not found|no longer exists|does not exist/i;

/**
 * Question that checks whether a property can still be fetched by id.
 * Answers `false` when the API returns no property or a not-found error;
 * any other error (including a missing property API) propagates.
 */
export class PropertyRetrievable extends Question<Promise<boolean>> {
	static byId(propertyId: string): PropertyRetrievable {
		return new PropertyRetrievable(propertyId);
	}

	private constructor(private readonly propertyId: string) {
		super(`whether the property ${propertyId} is retrievable`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<boolean> {
		try {
			const response = await GraphQLClient.as(actor as unknown as Actor).execute(PROPERTY_BY_ID_QUERY, { id: this.propertyId });
			const property = response.data['property'] as PropertyResult | null;
			return property !== null && property !== undefined;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (NOT_FOUND_PATTERN.test(message)) {
				return false;
			}
			throw error;
		}
	}

	override toString = () => `whether the property ${this.propertyId} is retrievable`;
}
