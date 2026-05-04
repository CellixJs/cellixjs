import { CommunityPage, type E2ECommunityPage } from '@ocom-verification/verification-shared/pages';
import { PlaywrightPageAdapter } from '@ocom-verification/verification-shared/pages/playwright';
import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { BrowseTheWeb } from '../../../shared/abilities/browse-the-web.ts';
import type { CommunityE2ENotes } from '../abilities/community-types.ts';

/**
 * Creates a community through the browser UI.
 */
export const CreateCommunity = (name: string) =>
	Interaction.where(the`#actor creates community "${name}" via UI`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);
		await page.goto('/community/accounts', {
			waitUntil: 'networkidle',
		});

		const adapter = new PlaywrightPageAdapter(page);
		const communityPage: E2ECommunityPage = new CommunityPage(adapter);

		await communityPage.createCommunityButton.click();
		await communityPage.fillName(name);
		await communityPage.clickCreate();

		try {
			// Wait briefly for validation error to appear (if any)
			await communityPage.firstValidationError.waitFor({ state: 'visible', timeout: 500 }).catch(() => {
				// No error element appeared, form succeeded
			});

			const isError = await communityPage.firstValidationError.isVisible().catch(() => false);
			if (isError) {
				const errorText = await communityPage.firstValidationError.textContent();
				await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityCreated', false), notes<CommunityE2ENotes>().set('errorMessage', errorText || 'Validation error'));
				return;
			}

			// No error found, form submitted successfully
			await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityName', name), notes<CommunityE2ENotes>().set('communityCreated', true), notes<CommunityE2ENotes>().set('errorMessage', null));
		} catch {
			const errorText = await communityPage.errorToast.textContent();
			await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityCreated', false), notes<CommunityE2ENotes>().set('errorMessage', errorText || 'Unknown error'));
		}
	});
