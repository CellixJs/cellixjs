import { notes, Question } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf, optionalText } from '../abilities/community-portal-page.ts';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';

export const BillingError = () =>
	Question.about('the captured billing error', async (actor) => {
		const page = billingPageOn(communityBrowserPageOf(actor));
		const pageError = await optionalText(page.firstValidationError);
		if (pageError) {
			return pageError;
		}
		const feedback = await optionalText(page.errorFeedback);
		if (feedback) {
			return feedback;
		}
		try {
			return await actor.answer(notes<CommunityE2ENotes>().get('lastBillingError'));
		} catch {
			return undefined;
		}
	});

export const BaselineTransactionCount = () =>
	Question.about('the baseline billing transaction count', async (actor) => {
		try {
			return await actor.answer(notes<CommunityE2ENotes>().get('baselineTransactionCount'));
		} catch {
			return undefined;
		}
	});
