import { type Actor, Interaction, the } from '@serenity-js/core';
import { adminBasePathOf, browserPageOf, openPropertiesListOn } from '../abilities/admin-portal-page.ts';

/**
 * Low-level interaction that navigates the actor's browser to the admin
 * properties list of the managed community and waits for it to render.
 */
export const OpenPropertiesList = () =>
	Interaction.where(the`#actor opens the properties list`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = browserPageOf(actor);
		await openPropertiesListOn(page, await adminBasePathOf(actor));
	});
