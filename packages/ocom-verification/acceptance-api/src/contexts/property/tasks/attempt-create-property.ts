import { type Actor, notes, Task } from '@serenity-js/core';
import { CreateProperty as CreatePropertyAbility } from '../../../shared/abilities/create-property.ts';
import { PropertyPostCommitProbeError } from '../../../shared/abilities/property-post-commit-probe-error.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';

/**
 * Task that attempts to create a property expected to be rejected, capturing
 * the outcome in actor notes instead of failing the scenario.
 */
export class AttemptCreateProperty extends Task {
	static named(propertyName: string) {
		return new AttemptCreateProperty(propertyName);
	}

	private constructor(private readonly propertyName: string) {
		super(`attempts to create a property named "${propertyName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		await actor.attemptsTo(
			notes<PropertyNotes>().set('lastPropertyStatus', undefined as unknown as string),
			notes<PropertyNotes>().set('lastPropertyError', undefined as unknown as string),
			notes<PropertyNotes>().set('lastPropertyId', undefined as unknown as string),
			notes<PropertyNotes>().set('lastPropertyName', undefined as unknown as string),
		);

		try {
			const property = await CreatePropertyAbility.as(actor).performAs(actor, { propertyName: this.propertyName });
			await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyId', property.id), notes<PropertyNotes>().set('lastPropertyName', property.propertyName), notes<PropertyNotes>().set('lastPropertyStatus', 'SUCCESS'));
		} catch (error) {
			if (error instanceof PropertyPostCommitProbeError) {
				// The mutation was not rejected — the write committed. Fail the
				// scenario instead of recording this as the expected rejection.
				throw error;
			}
			const message = error instanceof Error ? error.message : String(error);
			await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyError', message));
		}
	}

	override toString = () => `attempts to create a property named "${this.propertyName}"`;
}
