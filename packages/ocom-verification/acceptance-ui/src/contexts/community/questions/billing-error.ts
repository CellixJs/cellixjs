import { notes, Question } from '@serenity-js/core';
import type { CommunityUiNotes } from '../notes/community-notes.ts';
import { billingFeedbackPage, billingPageFor } from '../tasks/community-screen.ts';

export const BillingError = () =>
	Question.about('the captured billing error', async (actor) => {
		const pageError = ((await billingPageFor(actor).firstValidationError.textContent()) ?? '').trim();
		if (pageError) {
			return pageError;
		}
		const feedback = ((await billingFeedbackPage().errorFeedback.textContent()) ?? '').trim();
		if (feedback) {
			return feedback;
		}
		try {
			return await actor.answer(notes<CommunityUiNotes>().get('lastBillingError'));
		} catch {
			return undefined;
		}
	});

export const BaselineTransactionCount = () =>
	Question.about('the baseline billing transaction count', async (actor) => {
		try {
			return await actor.answer(notes<CommunityUiNotes>().get('baselineTransactionCount'));
		} catch {
			return undefined;
		}
	});
