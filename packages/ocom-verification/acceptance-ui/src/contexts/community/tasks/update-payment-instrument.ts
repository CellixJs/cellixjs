import { RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { CommunityPage, type CommunityPaymentInstrumentFields } from '@ocom-verification/verification-shared/pages';
import { type Actor, Task } from '@serenity-js/core';
import { billingPageFor, flushCommunityUi, RenderCommunityBilling } from './community-screen.ts';

export const UpdatePaymentInstrument = (fields: CommunityPaymentInstrumentFields): Task =>
	Task.where(
		'#actor updates the community payment instrument',
		RenderCommunityBilling(),
		new TaskStep<Actor>('#actor fills and submits the payment instrument', async (actor) => {
			const billingPage = billingPageFor(actor);
			await billingPage.clickUpdatePaymentInstrument();
			const formPage = new CommunityPage(new DomPageAdapter(RenderInDom.as(actor).container));
			await formPage.fillPaymentInstrument(fields);
			await billingPage.clickSavePlan();
			await flushCommunityUi();
		}),
	);
