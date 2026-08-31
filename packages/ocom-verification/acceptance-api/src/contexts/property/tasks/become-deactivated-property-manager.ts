import { type Actor, notes, Task } from '@serenity-js/core';
import { setActorContext } from '../../../shared/abilities/actor-auth.ts';
import { ProvisionDeactivatedPropertyManager } from '../../../shared/abilities/provision-deactivated-property-manager.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';

/**
 * Given-glue task that arranges the actor as a member of the given community
 * whose end-user role grants property management but whose account is
 * REJECTED (deactivated), then registers the actor's member/community context
 * headers so requests carry the deactivated principal.
 */
export class BecomeDeactivatedPropertyManager extends Task {
	static ofCommunity(communityId: string) {
		return new BecomeDeactivatedPropertyManager(communityId);
	}

	private constructor(private readonly communityId: string) {
		super('becomes a deactivated property manager');
	}

	async performAs(actor: Actor): Promise<void> {
		if (!this.communityId) {
			throw new Error('No community id available to provision a deactivated property manager. Did a property manager set up a community first?');
		}

		const { memberId } = await ProvisionDeactivatedPropertyManager.as(actor).performAs(actor, this.communityId);

		setActorContext(actor.name, { memberId, communityId: this.communityId });

		await actor.attemptsTo(notes<PropertyNotes>().set('activeCommunityId', this.communityId), notes<PropertyNotes>().set('actingMemberId', memberId));
	}

	override toString = () => 'becomes a deactivated property manager';
}
