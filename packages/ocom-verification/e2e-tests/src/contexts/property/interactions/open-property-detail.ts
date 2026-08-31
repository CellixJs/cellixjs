import { type Actor, Interaction, the } from '@serenity-js/core';
import { adminBasePathOf, browserPageOf, openPropertyDetailOn } from '../abilities/admin-portal-page.ts';

/**
 * Low-level interaction that opens the detail form of a property through the
 * properties list View action and waits for its values to load.
 */
export const OpenPropertyDetail = (propertyName: string) =>
	Interaction.where(the`#actor opens the details of the property "${propertyName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = browserPageOf(actor);
		await openPropertyDetailOn(page, await adminBasePathOf(actor), propertyName);
	});
