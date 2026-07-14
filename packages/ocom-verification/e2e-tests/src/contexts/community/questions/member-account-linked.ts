import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { MemberAccountsPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, notes, Question } from '@serenity-js/core';
import type { E2EMemberAccountsPage } from '../../../shared/page-contracts.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

export const MemberAccountLinked = (email: string) =>
	Question.about(`whether the member account list contains "${email}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);
		const memberAccountsPage: E2EMemberAccountsPage = new MemberAccountsPage(new PlaywrightPageAdapter(page));
		await memberAccountsPage.linkedAccountEmail(email).waitFor({ state: 'visible', timeout: 15_000 });
		return await memberAccountsPage.linkedAccountEmail(email).isVisible();
	});

export const MemberAccountCount = (email: string) => Question.about(`the number of confirmed member account links for "${email}"`, (actor) => actor.answer(notes<MemberE2ENotes>().get('memberAccountCount')));
