import { CommunityPage } from '@ocom-verification/verification-shared/pages';
import { JsdomPageAdapter } from '@ocom-verification/verification-shared/pages/jsdom';
import { Interaction, notes } from '@serenity-js/core';
import type { CommunityUiNotes } from './types.ts';

/**
 * Fills and submits the community creation form in jsdom.
 */
export const SubmitCommunityForm = (name: string) =>
	Interaction.where(`#actor submits community form with name "${name}"`, async (actor) => {
		const container: HTMLElement = await actor.answer(notes<CommunityUiNotes>().get('container'));
		const adapter = new JsdomPageAdapter(container);
		const page = new CommunityPage(adapter);

		await page.fillName(name);
		await page.clickCreate();

		const submitted = container.dataset.formSubmitted === 'true';
		const communityName = container.dataset.communityName ?? '';
		const lastValidationError = container.dataset.lastValidationError ?? '';

		await actor.attemptsTo(notes<CommunityUiNotes>().set('formSubmitted', submitted), notes<CommunityUiNotes>().set('communityName', communityName), notes<CommunityUiNotes>().set('lastValidationError', lastValidationError));
	});
