import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import { PROPERTY_BY_ID_QUERY, type PropertyResult } from '../../../shared/graphql/property-operations.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';

type ViewedField = 'propertyName' | 'communityId';

/**
 * Question that reads a field of the property the actor last viewed.
 * Prefers a live API read by the viewed property id, falling back to actor notes.
 */
export class ViewedProperty extends Question<Promise<string>> {
	static propertyName(): ViewedProperty {
		return new ViewedProperty('propertyName');
	}

	static communityId(): ViewedProperty {
		return new ViewedProperty('communityId');
	}

	private constructor(private readonly field: ViewedField) {
		super(`the viewed property ${field}`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const viewedPropertyId = await this.readNote(actor, 'viewedPropertyId');
		const apiValue = await this.readFieldFromApi(actor, viewedPropertyId);
		if (apiValue) {
			return apiValue;
		}

		if (this.field === 'propertyName') {
			const notedName = await this.readNote(actor, 'viewedPropertyName');
			if (notedName) {
				return notedName;
			}
		}
		throw new Error(`No viewed property ${this.field} found in the system or actor notes. Did the actor view a property first?`);
	}

	override toString = () => `the viewed property ${this.field}`;

	private async readFieldFromApi(actor: AnswersQuestions & UsesAbilities, propertyId?: string): Promise<string | undefined> {
		if (!propertyId) {
			return undefined;
		}
		try {
			const response = await GraphQLClient.as(actor as unknown as Actor).execute(PROPERTY_BY_ID_QUERY, { id: propertyId });
			const property = response.data['property'] as PropertyResult | null;
			if (!property) {
				return undefined;
			}
			return this.field === 'propertyName' ? property.propertyName : property.community?.id;
		} catch {
			return undefined;
		}
	}

	private async readNote(actor: AnswersQuestions & UsesAbilities, key: keyof PropertyNotes): Promise<string | undefined> {
		try {
			return await actor.answer(notes<Record<typeof key, string>>().get(key));
		} catch {
			return undefined;
		}
	}
}
