import { type Actor, notes, Task } from '@serenity-js/core';
import { AssignMemberAccount as AssignMemberAccountAbility } from '../../../shared/abilities/assign-member-account.ts';
import type { MemberNotes } from '../notes/member-notes.ts';
import { PrincipalMemberIdForCommunity } from '../questions/principal-member-id-for-community.ts';

interface AssignmentDetails {
	communityId: string;
	memberId: string;
	endUserId: string;
}

export class AssignMemberAccount extends Task {
	static to(details: AssignmentDetails): AssignMemberAccount {
		return new AssignMemberAccount(details);
	}

	private constructor(private readonly details: AssignmentDetails) {
		super('assigns an end-user account to a member');
	}

	override async performAs(actor: Actor): Promise<void> {
		const principalMemberId = await actor.answer(PrincipalMemberIdForCommunity.inCommunity(this.details.communityId));
		await AssignMemberAccountAbility.as(actor).performAs(actor, { ...this.details, principalMemberId });
		await actor.attemptsTo(notes<MemberNotes>().set('lastLinkedEndUserId', this.details.endUserId));
	}
}
