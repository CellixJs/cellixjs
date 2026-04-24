import { CommunityPage, type UiCommunityPage } from '@ocom-verification/verification-shared/pages';
import { JsdomPageAdapter } from '@ocom-verification/verification-shared/pages/jsdom';
import { type Actor, Interaction, notes } from '@serenity-js/core';
import type { CommunityUiNotes } from '../abilities/community-types.ts';

export const CreateCommunity = (name: string) =>
	Interaction.where(`#actor submits community form with name "${name}"`, async (actor) => {
		const container: HTMLElement = await actor.answer(notes<CommunityUiNotes>().get('container'));
		const adapter = new JsdomPageAdapter(container);
		const page: UiCommunityPage = new CommunityPage(adapter);

		await page.fillName(name);
		await page.clickCreate();

		const submitted = container.dataset['formSubmitted'] === 'true';
		const communityName = container.dataset['communityName'] ?? '';
		const lastValidationError = container.dataset['lastValidationError'] ?? '';

		await (actor as Actor).attemptsTo(
			notes<CommunityUiNotes>().set('formSubmitted', submitted),
			notes<CommunityUiNotes>().set('communityName', communityName),
			notes<CommunityUiNotes>().set('lastValidationError', lastValidationError),
		);
	});
