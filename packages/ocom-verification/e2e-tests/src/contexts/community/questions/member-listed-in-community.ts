import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { MemberListPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Question } from '@serenity-js/core';

export const MemberListedInCommunity = (memberName: string) =>
	Question.about(`whether member "${memberName}" appears in the browser member list`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);
		const memberListPage = new MemberListPage(new PlaywrightPageAdapter(page));
		return await memberListPage.memberName(memberName).isVisible();
	});
