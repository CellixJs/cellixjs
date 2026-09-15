import { type Actor, notes, Task } from '@serenity-js/core';
import { ProcessSubscriptionCharge as ProcessSubscriptionChargeAbility } from '../../../shared/abilities/process-subscription-charge.ts';
import type { CommunityNotes } from '../notes/community-notes.ts';
import { requireCommunityId } from '../questions/read-community-note.ts';

export class ProcessSubscriptionCharge extends Task {
	static now() {
		return new ProcessSubscriptionCharge();
	}

	private constructor() {
		super('processes a subscription charge');
	}

	async performAs(actor: Actor): Promise<void> {
		const communityId = await requireCommunityId(actor);
		const community = await ProcessSubscriptionChargeAbility.as(actor).performAs(actor, { communityId });
		await actor.attemptsTo(notes<CommunityNotes>().set('lastCommunityId', community.id), notes<CommunityNotes>().set('lastBillingStatus', 'SUCCESS'));
	}

	override toString = () => 'processes a subscription charge';
}
