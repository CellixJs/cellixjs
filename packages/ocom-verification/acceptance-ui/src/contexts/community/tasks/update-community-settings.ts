import { RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { CommunitySettingsPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Task } from '@serenity-js/core';
import type { AcceptanceUiCommunitySettingsPage } from '../../../shared/page-contracts.ts';

/** Settings fields that can be edited on the community settings form. */
export interface CommunitySettingsFormDetails {
	name?: string;
	whiteLabelDomain?: string;
	domain?: string;
	handle?: string;
}

/** Let the form's async `onFinish`/`onSave` handlers settle before assertions run. */
async function flushPendingReactWork(): Promise<void> {
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export const UpdateCommunitySettings = (details: CommunitySettingsFormDetails): Task =>
	Task.where(
		`#actor updates the community settings (${Object.keys(details).join(', ')})`,
		new TaskStep<Actor>('#actor fills the community settings form and saves', async (actor) => {
			const page: AcceptanceUiCommunitySettingsPage = new CommunitySettingsPage(new DomPageAdapter(RenderInDom.as(actor).container));

			if (details.name !== undefined) {
				await page.fillName(details.name);
			}
			if (details.whiteLabelDomain !== undefined) {
				await page.fillWhiteLabelDomain(details.whiteLabelDomain);
			}
			if (details.domain !== undefined) {
				await page.fillDomain(details.domain);
			}
			if (details.handle !== undefined) {
				await page.fillHandle(details.handle);
			}

			await page.clickSave();

			await flushPendingReactWork();
		}),
	);
