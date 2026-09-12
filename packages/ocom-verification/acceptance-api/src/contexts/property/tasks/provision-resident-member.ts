import { type Actor, notes, Task } from '@serenity-js/core';
import { setActorContext } from '../../../shared/abilities/actor-auth.ts';
import { ProvisionResidentMember as ProvisionResidentMemberAbility } from '../../../shared/abilities/provision-resident-member.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';

/**
 * Given-glue task that arranges the actor as a resident member of the given
 * community whose end-user role denies every property permission, then
 * registers the actor's member/community context headers.
 */
export class BecomeResidentMember extends Task {
	static ofCommunity(communityId: string) {
		return new BecomeResidentMember(communityId);
	}

	private constructor(private readonly communityId: string) {
		super('becomes a resident member without property permissions');
	}

	async performAs(actor: Actor): Promise<void> {
		if (!this.communityId) {
			throw new Error('No community id available to provision a resident member. Did a property manager set up a community first?');
		}

		const { memberId } = await ProvisionResidentMemberAbility.as(actor).performAs(actor, this.communityId);

		setActorContext(actor.name, { memberId, communityId: this.communityId });

		await actor.attemptsTo(notes<PropertyNotes>().set('activeCommunityId', this.communityId), notes<PropertyNotes>().set('actingMemberId', memberId));
	}

	override toString = () => 'becomes a resident member without property permissions';
}
