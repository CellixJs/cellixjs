import { type Actor, Interaction, the } from '@serenity-js/core';
import { memberPropertiesListOn, memberPropertyPortalPageOf, memberPropertyRouteDiagnostic } from '../abilities/member-property-portal-page.ts';
import { OpenMemberPropertyDirectory } from './open-member-property-directory.ts';

/** Opens a member Property detail from the directory once the member route is available. */
export const OpenMemberPropertyDetail = (propertyName: string) =>
	Interaction.where(the`#actor opens the member Property details for "${propertyName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		await actor.attemptsTo(OpenMemberPropertyDirectory());
		const page = await memberPropertyPortalPageOf(actor);
		const list = memberPropertiesListOn(page);
		const headingVisible = await list.heading
			.waitFor({ state: 'visible', timeout: 5_000 })
			.then(() => true)
			.catch(() => false);
		if (!headingVisible) {
			throw new Error(`The member Property directory did not render before opening "${propertyName}": ${await memberPropertyRouteDiagnostic(page)}`);
		}
		await list.clickViewForProperty(propertyName);
	});
