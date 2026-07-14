import { type Actor, notes, Task } from '@serenity-js/core';
import { CreateMember as CreateMemberAbility, type CreateMemberDetails } from '../../../shared/abilities/create-member.ts';
import type { MemberNotes } from '../notes/member-notes.ts';
import { PrincipalMemberIdForCommunity } from '../questions/principal-member-id-for-community.ts';

interface CreateMemberTaskDetails {
	memberName: string;
	role?: string;
	communityId?: string;
}

export class CreateMember extends Task {
	static withName(memberName: string) {
		return new CreateMember({ memberName });
	}

	static with(details: CreateMemberTaskDetails) {
		return new CreateMember(details);
	}

	private constructor(private readonly details: CreateMemberTaskDetails) {
		super(`creates a member named "${details.memberName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		if (!this.details.communityId) {
			throw new Error('communityId is required to create a member');
		}

		const principalMemberId = await actor.answer(PrincipalMemberIdForCommunity.inCommunity(this.details.communityId));
		const createDetails: CreateMemberDetails = {
			memberName: this.details.memberName,
			communityId: this.details.communityId,
			principalMemberId,
			...(this.details.role ? { role: this.details.role } : {}),
		};
		const member = await CreateMemberAbility.as(actor).performAs(actor, createDetails);

		await actor.attemptsTo(
			notes<MemberNotes>().set('lastMemberId', member.id ?? ''),
			notes<MemberNotes>().set('lastMemberCommunityId', this.details.communityId),
			notes<MemberNotes>().set('lastMemberName', member.memberName),
			notes<MemberNotes>().set('lastMemberStatus', 'SUCCESS'),
		);
	}

	override toString = () => `creates a member named "${this.details.memberName}"`;
}
