import { RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { MemberCreatePage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Task } from '@serenity-js/core';
import type { AcceptanceUiMemberCreatePage } from '../../../shared/page-contracts.ts';

/** Let the form's async `onFinish` callback settle before assertions run. */
async function flushPendingReactWork(): Promise<void> {
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export const CreateMember = (memberName: string): Task =>
	Task.where(
		`#actor creates a member named "${memberName}"`,
		new TaskStep<Actor>(`#actor fills the member name "${memberName}" and submits`, async (actor) => {
			const page: AcceptanceUiMemberCreatePage = new MemberCreatePage(new DomPageAdapter(RenderInDom.as(actor).container));

			await page.fillMemberName(memberName);
			await page.clickCreateMember();

			await flushPendingReactWork();
		}),
	);
