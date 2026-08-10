import { type Actor, notes, Task } from '@serenity-js/core';
import { UpdateProperty as UpdatePropertyAbility } from '../../../shared/abilities/update-property.ts';
import type { PropertyNotes, PropertyUpdateDetails } from '../notes/property-notes.ts';
import { toUpdatePropertyInput } from './update-property-input.ts';

/**
 * Task that attempts a property update expected to be rejected, capturing the
 * outcome in actor notes instead of failing the scenario.
 */
export class AttemptUpdateProperty extends Task {
	static of(propertyName: string, propertyId: string, details: PropertyUpdateDetails) {
		return new AttemptUpdateProperty(propertyName, propertyId, details);
	}

	private constructor(
		private readonly propertyName: string,
		private readonly propertyId: string,
		private readonly details: PropertyUpdateDetails,
	) {
		super(`attempts to update the property "${propertyName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyStatus', undefined as unknown as string), notes<PropertyNotes>().set('lastPropertyError', undefined as unknown as string));

		try {
			await UpdatePropertyAbility.as(actor).performAs(actor, toUpdatePropertyInput(this.propertyId, this.details));
			await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyStatus', 'SUCCESS'));
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyError', message));
		}
	}

	override toString = () => `attempts to update the property "${this.propertyName}"`;
}
