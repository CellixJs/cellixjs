import { type Actor, Interaction, the } from '@serenity-js/core';
import { adminBasePathOf, browserPageOf, openPropertiesListOn } from '../abilities/admin-portal-page.ts';
import { CreatePropertyViaForm } from './create-property.ts';

/**
 * Given-glue task that makes sure a property with the given name exists in
 * the managed community, creating it through the admin UI when it is not
 * listed yet. Conditional, so it is modelled as a single interaction.
 */
export const EnsurePropertyExists = (propertyName: string) =>
	Interaction.where(the`#actor makes sure the property "${propertyName}" exists`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = browserPageOf(actor);
		const listPage = await openPropertiesListOn(page, await adminBasePathOf(actor));
		if (await listPage.hasPropertyNamed(propertyName)) {
			return;
		}
		await actor.attemptsTo(CreatePropertyViaForm({ propertyName }));
	});
