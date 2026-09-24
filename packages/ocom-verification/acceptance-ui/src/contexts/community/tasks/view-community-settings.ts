import { RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { CommunitySettingsPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, notes, Task } from '@serenity-js/core';
import type { AcceptanceUiCommunitySettingsPage } from '../../../shared/page-contracts.ts';
import type { CommunityUiNotes } from '../notes/community-notes.ts';

/**
 * Reads the community name shown on the rendered settings form and records it
 * in actor notes so `Then` steps can assert on the displayed value.
 */
export const ViewCommunitySettings = (): Task =>
	Task.where(
		'#actor views the community settings',
		new TaskStep<Actor>('#actor reads the displayed community name', async (actor) => {
			const page: AcceptanceUiCommunitySettingsPage = new CommunitySettingsPage(new DomPageAdapter(RenderInDom.as(actor).container));
			const displayedName = (await page.nameInput.inputValue()) ?? '';

			await actor.attemptsTo(notes<CommunityUiNotes>().set('communityName', displayedName));
		}),
	);
