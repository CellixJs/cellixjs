import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, notes, Task } from '@serenity-js/core';
import { PROPERTY_FULL_CREATE_MUTATION, type PropertyFullCreateInput, type PropertyFullMutationResult } from '../../../shared/graphql/property-field-operations.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';
import { type PropertyFullFieldTable, toFullPropertySharedInput } from './property-full-field-set.ts';

/**
 * Task that creates a property providing the full user-managed field set in a
 * single mutation and records the outcome in actor notes.
 */
export class CreatePropertyWithFullFields extends Task {
	static from(details: PropertyFullFieldTable) {
		return new CreatePropertyWithFullFields(details);
	}

	private constructor(private readonly details: PropertyFullFieldTable) {
		super(`creates the property "${details['propertyName'] ?? ''}" with the full field set`);
	}

	async performAs(actor: Actor): Promise<void> {
		const propertyName = this.details['propertyName'];
		if (!propertyName) {
			throw new Error('The full field set table must include a propertyName row');
		}
		const input: PropertyFullCreateInput = {
			propertyName,
			...toFullPropertySharedInput(this.details),
		};

		const response = await GraphQLClient.as(actor).execute(PROPERTY_FULL_CREATE_MUTATION, { input });
		const result = response.data['propertyCreate'] as PropertyFullMutationResult | undefined;
		if (result?.status?.success !== true || !result.property) {
			throw new Error(`Creating the property "${propertyName}" with the full field set failed: ${result?.status?.errorMessage ?? 'no property was returned'}`);
		}

		await actor.attemptsTo(
			notes<PropertyNotes>().set('lastPropertyId', result.property.id),
			notes<PropertyNotes>().set('lastPropertyName', result.property.propertyName),
			notes<PropertyNotes>().set('lastPropertyStatus', 'SUCCESS'),
		);
	}

	override toString = () => `creates the property "${this.details['propertyName'] ?? ''}" with the full field set`;
}
