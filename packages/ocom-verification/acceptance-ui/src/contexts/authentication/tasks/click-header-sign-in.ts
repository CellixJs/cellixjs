import { HomePage, type UiHomePage } from '@ocom-verification/verification-shared/pages';
import { JsdomPageAdapter } from '@ocom-verification/verification-shared/pages/jsdom';
import { TaskStep } from '@ocom-verification/verification-shared/serenity';
import { type Activity, Task } from '@serenity-js/core';

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
			const page: UiHomePage = new HomePage(adapter);

			await page.clickSignIn();
			await flushAsync();
		}) as Activity,
	);
