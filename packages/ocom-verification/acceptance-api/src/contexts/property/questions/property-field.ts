import { type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import type { PropertyResult } from '../../../shared/graphql/property-operations.ts';
import { PropertyNamed } from './property-named.ts';

type ScalarField = 'propertyType';
type ListingDetailField = 'bedrooms' | 'bathrooms' | 'squareFeet';

/**
 * Question that reads a single field of a named property live from the API.
 * Fails with a diagnostic error when the property cannot be found.
 */
export class PropertyField extends Question<Promise<string | number | null>> {
	static propertyType(propertyName: string): PropertyField {
		return new PropertyField(propertyName, 'propertyType', undefined);
	}

	static bedrooms(propertyName: string): PropertyField {
		return new PropertyField(propertyName, undefined, 'bedrooms');
	}

	static bathrooms(propertyName: string): PropertyField {
		return new PropertyField(propertyName, undefined, 'bathrooms');
	}

	static squareFeet(propertyName: string): PropertyField {
		return new PropertyField(propertyName, undefined, 'squareFeet');
	}

	private constructor(
		private readonly propertyName: string,
		private readonly scalarField: ScalarField | undefined,
		private readonly listingDetailField: ListingDetailField | undefined,
	) {
		super(`the ${scalarField ?? listingDetailField} of the property "${propertyName}"`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string | number | null> {
		const property = await actor.answer(PropertyNamed.called(this.propertyName));
		if (!property) {
			throw new Error(`Property "${this.propertyName}" was not found in the properties list`);
		}
		return this.fieldOf(property);
	}

	override toString = () => `the ${this.scalarField ?? this.listingDetailField} of the property "${this.propertyName}"`;

	private fieldOf(property: PropertyResult): string | number | null {
		if (this.scalarField) {
			return property[this.scalarField];
		}
		if (this.listingDetailField) {
			return property.listingDetail?.[this.listingDetailField] ?? null;
		}
		throw new Error('PropertyField was constructed without a field');
	}
}
