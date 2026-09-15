import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf, optionalText } from '../abilities/community-portal-page.ts';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';

export const CapturePageBillingError = () =>
	Interaction.where(the`#actor captures billing error feedback`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = billingPageOn(communityBrowserPageOf(actor));
		const validation = await optionalText(page.firstValidationError);
		const feedback = await optionalText(page.errorFeedback);
		const message = validation || feedback;
		if (message) {
			await actor.attemptsTo(notes<CommunityE2ENotes>().set('lastBillingError', message));
		}
	});
