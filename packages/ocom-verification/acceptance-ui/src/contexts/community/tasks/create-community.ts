import { CommunityPage, type UiCommunityPage } from '@ocom-verification/verification-shared/pages';
import { JsdomPageAdapter } from '@ocom-verification/verification-shared/pages/jsdom';
import { TaskStep } from '@ocom-verification/verification-shared/serenity';
import { type Activity, Task } from '@serenity-js/core';

async function flushAsync(): Promise<void> {
	await new Promise<void>((resolve) => {
		setTimeout(resolve, 0);
	});
	await new Promise<void>((resolve) => {
		setTimeout(resolve, 0);
	});
}

export const CreateCommunity = (container: HTMLElement, name: string) =>
	Task.where(
		`#actor fills community name "${name}" and submits`,
		new TaskStep(`#actor submits community name "${name}"`, async () => {
			const adapter = new JsdomPageAdapter(container);
			const page: UiCommunityPage = new CommunityPage(adapter);

			await page.fillName(name);
			await page.clickCreate();

			await flushAsync();
		}) as Activity,
	);
