import { type Actor, notes, Task } from '@serenity-js/core';
import { DeleteProperty as DeletePropertyAbility } from '../../../shared/abilities/delete-property.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';

/**
 * Task that soft-deletes a property through the API and records the outcome in actor notes.
 */
export class DeleteProperty extends Task {
	static of(propertyName: string, propertyId: string) {
		return new DeleteProperty(propertyName, propertyId);
	}

	private constructor(
		private readonly propertyName: string,
		private readonly propertyId: string,
	) {
		super(`deletes the property "${propertyName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		await DeletePropertyAbility.as(actor).performAs(actor, this.propertyId);

		await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyId', this.propertyId), notes<PropertyNotes>().set('lastPropertyName', this.propertyName), notes<PropertyNotes>().set('lastPropertyStatus', 'SUCCESS'));
	}

	override toString = () => `deletes the property "${this.propertyName}"`;
}
