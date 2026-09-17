import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Actor, notes, Task } from '@serenity-js/core';
import type { CommunityUiNotes } from '../notes/community-notes.ts';
import { billingPageFor, flushCommunityUi, RenderCommunityBilling } from './community-screen.ts';

export const ChangeSubscriptionTier = (plan: string): Task =>
	Task.where(
		`#actor changes the subscription plan to "${plan}"`,
		RenderCommunityBilling(),
		new TaskStep<Actor>(`#actor selects plan "${plan}" and saves`, async (actor) => {
			const page = billingPageFor(actor);
			const historyText = await page.historyText();
			await actor.attemptsTo(notes<CommunityUiNotes>().set('baselineTransactionCount', historyText ? historyText.split('\n').filter(Boolean).length : 0));
			await page.selectSubscriptionPlan(plan);
			await page.clickSavePlan();
			await flushCommunityUi();
		}),
	);
