import { JsdomPageAdapter } from '@cellix/serenity-framework/pages/jsdom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { HomePage } from '@ocom-verification/verification-shared/pages';
import { type Activity, Task } from '@serenity-js/core';
import type { AcceptanceUiHomePage } from '../../../shared/page-contracts.ts';

async function flushAsync(): Promise<void> {
	await new Promise<void>((resolve) => {
		setTimeout(resolve, 0);
	});
}

export const ClickHeaderSignIn = (container: HTMLElement) =>
	Task.where(
		'#actor clicks the sign-in button on the home page',
		new TaskStep('#actor clicks the sign-in button', async () => {
			const adapter = new JsdomPageAdapter(container);
			const page: AcceptanceUiHomePage = new HomePage(adapter);

			await page.clickSignIn();
			await flushAsync();
		}) as Activity,
	);
