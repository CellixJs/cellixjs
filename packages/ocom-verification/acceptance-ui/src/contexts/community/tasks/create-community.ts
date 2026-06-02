import { JsdomPageAdapter } from '@cellix/serenity-framework/pages/jsdom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { CommunityPage } from '@ocom-verification/verification-shared/pages';
import { type Activity, Task } from '@serenity-js/core';
import type { AcceptanceUiCommunityPage } from '../../../shared/page-contracts.ts';

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
			const page: AcceptanceUiCommunityPage = new CommunityPage(adapter);

			await page.fillName(name);
			await page.clickCreate();

			await flushAsync();
		}) as Activity,
	);
