import { type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import type { PropertyResult } from '../../../shared/graphql/property-operations.ts';
import { PropertiesList } from './properties-list.ts';

/**
 * Question that finds a property by its name in the actor's active community.
 * Answers `undefined` when no property with that name exists.
 */
export class PropertyNamed extends Question<Promise<PropertyResult | undefined>> {
	static called(propertyName: string): PropertyNamed {
		return new PropertyNamed(propertyName);
	}

	private constructor(private readonly propertyName: string) {
		super(`the property named "${propertyName}"`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<PropertyResult | undefined> {
		const properties = await actor.answer(PropertiesList.displayed());
		return properties.find((property) => property.propertyName === this.propertyName);
	}

	override toString = () => `the property named "${this.propertyName}"`;
}
