import { HomePage, type UiHomePage } from '@ocom-verification/verification-shared/pages';
import { JsdomPageAdapter } from '@ocom-verification/verification-shared/pages/jsdom';
import { Interaction } from '@serenity-js/core';

async function flushAsync(): Promise<void> {
	await new Promise<void>((resolve) => {
		setTimeout(resolve, 0);
	});
}

export const ClickHeaderSignIn = (container: HTMLElement) =>
	Interaction.where('#actor clicks the sign-in button on the home page', async () => {
		const adapter = new JsdomPageAdapter(container);
		const page: UiHomePage = new HomePage(adapter);

		await page.clickSignIn();
		await flushAsync();
	});
