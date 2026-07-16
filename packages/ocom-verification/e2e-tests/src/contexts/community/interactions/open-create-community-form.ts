import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { type Actor, Interaction, the } from '@serenity-js/core';

/**
 * Low-level interaction that opens the create-community form in the community
 * accounts portal.
 */
export const OpenCreateCommunityForm = () =>
	Interaction.where(the`#actor opens the create community form`, async (serenityActor) => {
		const { page } = BrowseTheWeb.withActor(serenityActor as unknown as Actor);
		await page.goto('/community/accounts/create-community', {
			waitUntil: 'networkidle',
		});
	});
