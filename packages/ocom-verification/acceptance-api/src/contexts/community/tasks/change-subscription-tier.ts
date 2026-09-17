import { toSubscriptionTier } from '@ocom-verification/verification-shared/test-data';
import { type Actor, notes, Task } from '@serenity-js/core';
import { UpdateSubscriptionTier as UpdateSubscriptionTierAbility } from '../../../shared/abilities/update-subscription-tier.ts';
import type { CommunityNotes } from '../notes/community-notes.ts';
import { BillingHistory } from '../questions/billing-history.ts';
import { requireCommunityId } from '../questions/read-community-note.ts';

export class ChangeSubscriptionTier extends Task {
	static to(plan: string) {
		return new ChangeSubscriptionTier(plan);
	}

	private constructor(private readonly plan: string) {
		super(`changes the subscription plan to "${plan}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const communityId = await requireCommunityId(actor);
		const subscriptionTier = toSubscriptionTier(this.plan);
		if (!subscriptionTier) {
			throw new Error(`A subscription plan is required to change billing, received "${this.plan}"`);
		}

		const history = await actor.answer(BillingHistory.displayed());
		await actor.attemptsTo(notes<CommunityNotes>().set('baselineTransactionCount', history.length));

		const community = await UpdateSubscriptionTierAbility.as(actor).performAs(actor, { communityId, subscriptionTier });
		await actor.attemptsTo(notes<CommunityNotes>().set('lastCommunityId', community.id), notes<CommunityNotes>().set('lastBillingStatus', 'SUCCESS'));
	}

	override toString = () => `changes the subscription plan to "${this.plan}"`;
}
