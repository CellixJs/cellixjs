import { RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { CommunityPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Task } from '@serenity-js/core';
import type { AcceptanceUiCommunityPage } from '../../../shared/page-contracts.ts';

/** Let the form's async `onFinish`/`onSave` handlers settle before assertions run. */
async function flushPendingReactWork(): Promise<void> {
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export const CreateCommunity = (name: string): Task =>
	Task.where(
		`#actor creates a community named "${name}"`,
		new TaskStep<Actor>(`#actor fills the community name "${name}" and submits`, async (actor) => {
			const page: AcceptanceUiCommunityPage = new CommunityPage(new DomPageAdapter(RenderInDom.as(actor).container));

			await page.fillName(name);
			await page.clickCreate();

			await flushPendingReactWork();
		}),
	);
