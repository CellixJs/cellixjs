import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Actor, notes, Task } from '@serenity-js/core';
import type { CommunityUiNotes } from '../notes/community-notes.ts';
import { billingFeedbackPage, billingPageFor, flushCommunityUi, RenderCommunityBilling } from './community-screen.ts';

export const ProcessSubscriptionCharge = (): Task =>
	Task.where(
		'#actor processes a subscription charge',
		RenderCommunityBilling(),
		new TaskStep<Actor>('#actor clicks process subscription charge', async (actor) => {
			const page = billingPageFor(actor);
			await page.clickProcessCharge();
			await flushCommunityUi();
			const errorText = ((await billingFeedbackPage().errorFeedback.textContent()) ?? '').trim();
			if (errorText) {
				await actor.attemptsTo(notes<CommunityUiNotes>().set('lastBillingError', errorText));
			}
		}),
	);
