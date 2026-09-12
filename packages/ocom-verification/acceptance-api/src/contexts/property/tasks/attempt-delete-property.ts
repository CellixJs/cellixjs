import { type Actor, notes, Task } from '@serenity-js/core';
import { DeleteProperty as DeletePropertyAbility } from '../../../shared/abilities/delete-property.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';

/**
 * Task that attempts a property delete expected to be rejected, capturing the
 * outcome in actor notes instead of failing the scenario.
 */
export class AttemptDeleteProperty extends Task {
	static of(propertyName: string, propertyId: string) {
		return new AttemptDeleteProperty(propertyName, propertyId);
	}

	private constructor(
		private readonly propertyName: string,
		private readonly propertyId: string,
	) {
		super(`attempts to delete the property "${propertyName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyStatus', undefined as unknown as string), notes<PropertyNotes>().set('lastPropertyError', undefined as unknown as string));

		try {
			await DeletePropertyAbility.as(actor).performAs(actor, this.propertyId);
			await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyStatus', 'SUCCESS'));
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyError', message));
		}
	}

	override toString = () => `attempts to delete the property "${this.propertyName}"`;
}
