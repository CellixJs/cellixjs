import { type Actor, notes, Task } from '@serenity-js/core';
import { RemoveMember as RemoveMemberAbility } from '../../../shared/abilities/remove-member.ts';
import type { MemberNotes } from '../notes/member-notes.ts';
import { PrincipalMemberIdForCommunity } from '../questions/principal-member-id-for-community.ts';

export class RemoveMember extends Task {
	static withId(memberId: string, communityId: string): RemoveMember {
		return new RemoveMember(memberId, communityId);
	}

	private constructor(
		private readonly memberId: string,
		private readonly communityId: string,
	) {
		super(`removes member "${memberId}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const principalMemberId = await actor.answer(notes<MemberNotes>().get('principalMemberId')).catch(() => actor.answer(PrincipalMemberIdForCommunity.inCommunity(this.communityId)));
		const authorizationToken = await actor.answer(notes<MemberNotes>().get('authorizationToken')).catch(() => undefined);
		await RemoveMemberAbility.as(actor).performAs(actor, {
			memberId: this.memberId,
			communityId: this.communityId,
			principalMemberId,
			...(authorizationToken ? { authorizationToken } : {}),
		});
		await actor.attemptsTo(notes<MemberNotes>().set('lastMemberRemoved', true), notes<MemberNotes>().set('lastMemberStatus', 'REMOVED'));
	}
}
