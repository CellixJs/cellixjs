import { RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { MemberListPage } from '@ocom-verification/verification-shared/pages';
import { Question } from '@serenity-js/core';

export const MemberListedInCommunity = (memberName: string) =>
	Question.about(`whether member "${memberName}" appears in the rendered member list`, async (actor) => {
		const page = new MemberListPage(new DomPageAdapter(RenderInDom.as(actor).container));
		return await page.memberName(memberName).isVisible();
	});
