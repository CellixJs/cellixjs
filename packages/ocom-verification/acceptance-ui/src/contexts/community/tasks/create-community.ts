import { CommunityPage, type UiCommunityPage } from '@ocom-verification/verification-shared/pages';
import { JsdomPageAdapter } from '@ocom-verification/verification-shared/pages/jsdom';
import { Interaction } from '@serenity-js/core';

async function flushAsync(): Promise<void> {
	await new Promise<void>((resolve) => {
		setTimeout(resolve, 0);
	});
	await new Promise<void>((resolve) => {
		setTimeout(resolve, 0);
	});
}

export const CreateCommunity = (container: HTMLElement, name: string) =>
	Interaction.where(`#actor fills community name "${name}" and submits`, async () => {
		const adapter = new JsdomPageAdapter(container);
		const page: UiCommunityPage = new CommunityPage(adapter);

		await page.fillName(name);
		await page.clickCreate();

		await flushAsync();
	});
