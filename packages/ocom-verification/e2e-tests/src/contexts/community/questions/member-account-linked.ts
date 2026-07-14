import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { MemberAccountsPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Question } from '@serenity-js/core';
import type { E2EMemberAccountsPage } from '../../../shared/page-contracts.ts';

export const MemberAccountLinked = (email: string) =>
	Question.about(`whether the member account list contains "${email}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);
		const memberAccountsPage: E2EMemberAccountsPage = new MemberAccountsPage(new PlaywrightPageAdapter(page));
		await memberAccountsPage.linkedAccountEmail(email).waitFor({ state: 'visible', timeout: 15_000 });
		return await memberAccountsPage.linkedAccountEmail(email).isVisible();
	});
