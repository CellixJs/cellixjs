import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { CommunityPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Interaction, the } from '@serenity-js/core';
import type { E2ECommunityPage } from '../../../shared/page-contracts.ts';

/**
 * Low-level interaction that fills the community name on the create-community
 * form.
 */
export const FillCommunityForm = (name: string) =>
	Interaction.where(the`#actor fills the community form with the name "${name}"`, async (serenityActor) => {
		const { page } = BrowseTheWeb.withActor(serenityActor as unknown as Actor);
		const communityPage: E2ECommunityPage = new CommunityPage(new PlaywrightPageAdapter(page));

		await communityPage.fillName(name);
	});
