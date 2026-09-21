import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { CommunityPage, type CommunityPaymentInstrumentFields } from '@ocom-verification/verification-shared/pages';
import { Interaction, the } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf } from '../abilities/community-portal-page.ts';

export const FillPaymentInstrument = (fields: CommunityPaymentInstrumentFields) =>
	Interaction.where(the`#actor fills the payment instrument`, async (actor) => {
		const page = communityBrowserPageOf(actor);
		await billingPageOn(page).clickUpdatePaymentInstrument();
		await new CommunityPage(new PlaywrightPageAdapter(page)).fillPaymentInstrument(fields);
	});
