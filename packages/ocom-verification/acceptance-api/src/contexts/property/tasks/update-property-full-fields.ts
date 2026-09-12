import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, notes, Task } from '@serenity-js/core';
import {
	PROPERTY_FULL_UPDATE_MUTATION,
	type PropertyFullListingDetailInput,
	type PropertyFullMutationResult,
	type PropertyFullSharedInput,
	type PropertyFullUpdateInput,
} from '../../../shared/graphql/property-field-operations.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';
import { type PropertyFullFieldTable, splitList, toFullPropertySharedInput } from './property-full-field-set.ts';

/**
 * Task that updates a focused slice of the full property field set through
 * the API and records the outcome in actor notes. The update must succeed;
 * a failed or rejected mutation fails the task.
 */
export class UpdatePropertyFullFields extends Task {
	static withFields(propertyName: string, propertyId: string, details: PropertyFullFieldTable, activity: string) {
		return new UpdatePropertyFullFields(propertyName, propertyId, toFullPropertySharedInput(details), activity);
	}

	static withOwner(propertyName: string, propertyId: string, ownerId: string | null) {
		return new UpdatePropertyFullFields(propertyName, propertyId, { ownerId }, ownerId === null ? 'clears the owner' : 'sets the owner');
	}

	static withTags(propertyName: string, propertyId: string, tags: string) {
		return new UpdatePropertyFullFields(propertyName, propertyId, { tags: splitList(tags) }, `updates the tags to "${tags}"`);
	}

	static withListingDetail(propertyName: string, propertyId: string, listingDetail: PropertyFullListingDetailInput, activity: string) {
		return new UpdatePropertyFullFields(propertyName, propertyId, { listingDetail }, activity);
	}

	private constructor(
		private readonly propertyName: string,
		private readonly propertyId: string,
		private readonly input: PropertyFullSharedInput,
		activity: string,
	) {
		super(`${activity} of the property "${propertyName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const input: PropertyFullUpdateInput = {
			id: this.propertyId,
			...this.input,
		};

		const response = await GraphQLClient.as(actor).execute(PROPERTY_FULL_UPDATE_MUTATION, { input });
		const result = response.data['propertyUpdate'] as PropertyFullMutationResult | undefined;
		if (result?.status?.success !== true || !result.property) {
			throw new Error(`Updating the property "${this.propertyName}" failed: ${result?.status?.errorMessage ?? 'no property was returned'}`);
		}

		await actor.attemptsTo(
			notes<PropertyNotes>().set('lastPropertyId', result.property.id),
			notes<PropertyNotes>().set('lastPropertyName', result.property.propertyName),
			notes<PropertyNotes>().set('lastPropertyStatus', 'SUCCESS'),
		);
	}
}
