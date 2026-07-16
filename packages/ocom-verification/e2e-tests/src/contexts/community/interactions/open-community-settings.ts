import { Interaction, the } from '@serenity-js/core';
import { communityPortalPageOf, communitySettingsPathOf, openCommunitySettings } from '../abilities/community-portal-page.ts';

/**
 * Low-level interaction that opens the community admin settings screen and
 * waits for the settings form to load its current values.
 */
export const OpenCommunitySettings = () =>
	Interaction.where(the`#actor opens the community settings screen`, async (actor) => {
		const page = await communityPortalPageOf(actor);
		const path = await communitySettingsPathOf(actor);
		await openCommunitySettings(page, path);
	});
