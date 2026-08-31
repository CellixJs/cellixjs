import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, notes, Task } from '@serenity-js/core';
import { PROPERTY_BY_ID_QUERY, type PropertyResult } from '../../../shared/graphql/property-operations.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';

/**
 * Task that retrieves the details of a property by id through the API and
 * records the viewed fields in actor notes.
 */
export class ViewPropertyDetails extends Task {
	static of(propertyName: string, propertyId: string) {
		return new ViewPropertyDetails(propertyName, propertyId);
	}

	private constructor(
		private readonly propertyName: string,
		private readonly propertyId: string,
	) {
		super(`views the details of the property "${propertyName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const response = await GraphQLClient.as(actor).execute(PROPERTY_BY_ID_QUERY, { id: this.propertyId });
		const property = response.data['property'] as PropertyResult | null;
		if (!property) {
			throw new Error(`Property "${this.propertyName}" (${this.propertyId}) could not be retrieved by id`);
		}

		await actor.attemptsTo(notes<PropertyNotes>().set('viewedPropertyId', property.id), notes<PropertyNotes>().set('viewedPropertyName', property.propertyName));
	}

	override toString = () => `views the details of the property "${this.propertyName}"`;
}
