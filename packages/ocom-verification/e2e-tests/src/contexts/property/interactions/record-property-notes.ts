import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { browserPageOf, propertiesListOn } from '../abilities/admin-portal-page.ts';
import type { PropertyE2ENotes } from '../notes/property-notes.ts';

/**
 * Low-level interaction that records the currently listed property names in
 * actor notes as the baseline for negative-path assertions. Expects the
 * properties list to be open (see `OpenPropertiesList`).
 */
export const RecordBaselinePropertyNames = () =>
	Interaction.where(the`#actor records the baseline property names`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = browserPageOf(actor);
		await actor.attemptsTo(notes<PropertyE2ENotes>().set('baselinePropertyNames', await propertiesListOn(page).listedPropertyNames()));
	});
