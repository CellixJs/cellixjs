import { type Actor, notes, Task } from '@serenity-js/core';
import { UpdateProperty as UpdatePropertyAbility } from '../../../shared/abilities/update-property.ts';
import type { PropertyNotes, PropertyUpdateDetails } from '../notes/property-notes.ts';
import { toUpdatePropertyInput } from './update-property-input.ts';

/**
 * Task that updates a property through the API and records the outcome in actor notes.
 */
export class UpdateProperty extends Task {
	static of(propertyName: string, propertyId: string, details: PropertyUpdateDetails) {
		return new UpdateProperty(propertyName, propertyId, details);
	}

	private constructor(
		private readonly propertyName: string,
		private readonly propertyId: string,
		private readonly details: PropertyUpdateDetails,
	) {
		super(`updates the property "${propertyName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const property = await UpdatePropertyAbility.as(actor).performAs(actor, toUpdatePropertyInput(this.propertyId, this.details));

		await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyId', property.id), notes<PropertyNotes>().set('lastPropertyName', property.propertyName), notes<PropertyNotes>().set('lastPropertyStatus', 'SUCCESS'));
	}

	override toString = () => `updates the property "${this.propertyName}"`;
}
