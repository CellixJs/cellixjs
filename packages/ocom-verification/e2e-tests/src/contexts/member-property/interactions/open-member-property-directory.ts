import { type Actor, Interaction, the } from '@serenity-js/core';
import { memberBasePathOf, memberPropertyPortalPageOf } from '../abilities/member-property-portal-page.ts';

/**
 * Navigates to the actual member Property URL. It deliberately does not wait
 * for a feature selector so Phase 1 reports the missing route in assertions,
 * rather than mistaking it for browser infrastructure failure.
 */
export const OpenMemberPropertyDirectory = () =>
	Interaction.where(the`#actor opens the member Property directory`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await memberPropertyPortalPageOf(actor);
		await page.goto(`${await memberBasePathOf(actor)}/properties`, { waitUntil: 'networkidle' });
	});
