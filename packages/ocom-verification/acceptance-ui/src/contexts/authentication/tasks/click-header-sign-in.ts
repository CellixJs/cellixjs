import { RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { HomePage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Task } from '@serenity-js/core';
import type { AcceptanceUiHomePage } from '../../../shared/page-contracts.ts';

/** Let the sign-in handler's async work settle before assertions run. */
async function flushPendingReactWork(): Promise<void> {
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export const ClickHeaderSignIn = (): Task =>
	Task.where(
		'#actor clicks the sign-in button on the home page',
		new TaskStep<Actor>('#actor clicks the sign-in button', async (actor) => {
			const page: AcceptanceUiHomePage = new HomePage(new DomPageAdapter(RenderInDom.as(actor).container));

			await page.clickSignIn();

			await flushPendingReactWork();
		}),
	);
