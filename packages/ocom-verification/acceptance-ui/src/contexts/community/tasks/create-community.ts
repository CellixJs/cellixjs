import { TaskStep } from '@cellix/serenity-framework/serenity';
import { hasBillingInput } from '@ocom-verification/verification-shared/test-data';
import { type Actor, notes, Task } from '@serenity-js/core';
import type { CommunityUiDetails, CommunityUiNotes } from '../notes/community-notes.ts';
import { communityPageFor, flushCommunityUi, RenderCommunityBilling } from './community-screen.ts';

export const CreateCommunity = (nameOrDetails: string | CommunityUiDetails): Task => {
	const details: CommunityUiDetails = typeof nameOrDetails === 'string' ? { name: nameOrDetails } : nameOrDetails;
	const name = details.name ?? '';
	const billed = hasBillingInput(details);

	return Task.where(
		`#actor creates a community named "${name}"`,
		new TaskStep<Actor>(`#actor fills the community form for "${name}" and submits`, async (actor) => {
			const page = communityPageFor(actor);
			await page.fillName(name);
			if (details.plan) {
				await page.selectSubscriptionPlan(details.plan);
			}
			if (hasBillingInput(details)) {
				await page.fillPaymentInstrument(details);
			}
			await page.clickCreate();
			await flushCommunityUi();
		}),
		...(billed
			? [
					new TaskStep<Actor>('#actor opens billing after a billed community create', async (actor) => {
						let submitted = false;
						try {
							submitted = await actor.answer(notes<CommunityUiNotes>().get('formSubmitted'));
						} catch {
							submitted = false;
						}
						if (submitted) {
							await actor.attemptsTo(RenderCommunityBilling());
						}
					}),
				]
			: []),
	);
};
