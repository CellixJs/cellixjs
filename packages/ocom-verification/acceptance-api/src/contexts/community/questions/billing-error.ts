import { notes, Question } from '@serenity-js/core';
import type { CommunityNotes } from '../notes/community-notes.ts';

export const BillingError = {
	captured: () =>
		Question.about('the captured billing error', async (actor) => {
			try {
				return await actor.answer(notes<CommunityNotes>().get('lastBillingError'));
			} catch {
				return undefined;
			}
		}),
} as const;

export const BaselineTransactionCount = {
	recorded: () =>
		Question.about('the baseline billing transaction count', async (actor) => {
			try {
				return await actor.answer(notes<CommunityNotes>().get('baselineTransactionCount'));
			} catch {
				return undefined;
			}
		}),
} as const;
