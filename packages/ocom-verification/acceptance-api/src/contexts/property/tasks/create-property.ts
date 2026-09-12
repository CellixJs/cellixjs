import { type Actor, notes, Task } from '@serenity-js/core';
import { CreateProperty as CreatePropertyAbility } from '../../../shared/abilities/create-property.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';

/**
 * Task that creates a property through the API and records the outcome in actor notes.
 */
export class CreateProperty extends Task {
	static named(propertyName: string) {
		return new CreateProperty(propertyName);
	}

	private constructor(private readonly propertyName: string) {
		super(`creates a property named "${propertyName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const property = await CreatePropertyAbility.as(actor).performAs(actor, { propertyName: this.propertyName });

		await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyId', property.id), notes<PropertyNotes>().set('lastPropertyName', property.propertyName), notes<PropertyNotes>().set('lastPropertyStatus', 'SUCCESS'));
	}

	override toString = () => `creates a property named "${this.propertyName}"`;
}
