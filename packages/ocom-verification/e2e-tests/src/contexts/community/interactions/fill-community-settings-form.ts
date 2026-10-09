import { Interaction, the } from '@serenity-js/core';
import { communityPortalPageOf, settingsPageOn } from '../abilities/community-portal-page.ts';

/** Settings fields that can be edited on the community settings form. */
export interface CommunitySettingsFormDetails {
	name?: string;
	whiteLabelDomain?: string;
	domain?: string;
	handle?: string;
}

/**
 * Low-level interaction that fills the community settings form fields that are
 * present in the supplied details.
 */
export const FillCommunitySettingsForm = (details: CommunitySettingsFormDetails) =>
	Interaction.where(the`#actor fills the community settings form (${Object.keys(details).join(', ')})`, async (actor) => {
		const page = await communityPortalPageOf(actor);
		const settingsPage = settingsPageOn(page);

		if (details.name !== undefined) {
			await settingsPage.fillName(details.name);
		}
		if (details.whiteLabelDomain !== undefined) {
			await settingsPage.fillWhiteLabelDomain(details.whiteLabelDomain);
		}
		if (details.domain !== undefined) {
			await settingsPage.fillDomain(details.domain);
		}
		if (details.handle !== undefined) {
			await settingsPage.fillHandle(details.handle);
		}
	});
