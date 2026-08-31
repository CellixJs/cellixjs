import { type Actor, Interaction, the } from '@serenity-js/core';
import { browserPageOf, propertiesListOn, propertyFormOn, waitUntil } from '../abilities/admin-portal-page.ts';

/**
 * Low-level interaction that opens the create property form from the
 * properties list currently on screen.
 */
export const OpenCreatePropertyForm = () =>
	Interaction.where(the`#actor opens the create property form`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = browserPageOf(actor);
		await propertiesListOn(page).clickAddProperty();
		const formPage = propertyFormOn(page);
		await waitUntil(() => formPage.propertyNameInput.isVisible(), 'Timed out waiting for the create property form to render');
	});
