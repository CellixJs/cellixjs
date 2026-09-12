import { type Actor, notes, Task } from '@serenity-js/core';
import type { PropertyNotes } from '../notes/property-notes.ts';
import { PropertiesList } from '../questions/properties-list.ts';

/**
 * Task that reads the properties list of a community from the API and records
 * the visible property names in actor notes.
 */
export class ViewPropertiesList extends Task {
	/** View the properties of the actor's active community (from notes). */
	static displayed() {
		return new ViewPropertiesList(undefined);
	}

	/** View the properties of an explicit community (e.g. for actors without their own community context). */
	static ofCommunity(communityId: string) {
		return new ViewPropertiesList(communityId);
	}

	private constructor(private readonly communityId: string | undefined) {
		super('views the properties list');
	}

	async performAs(actor: Actor): Promise<void> {
		const properties = await actor.answer(this.communityId ? PropertiesList.ofCommunity(this.communityId) : PropertiesList.displayed());
		await actor.attemptsTo(
			notes<PropertyNotes>().set(
				'listedPropertyNames',
				properties.map((property) => property.propertyName),
			),
		);
	}

	override toString = () => 'views the properties list';
}
