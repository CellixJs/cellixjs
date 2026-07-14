import { type Actor, notes, Task } from '@serenity-js/core';
import { ListMembers as ListMembersAbility } from '../../../shared/abilities/list-members.ts';
import type { MemberNotes } from '../notes/member-notes.ts';
import { PrincipalMemberIdForCommunity } from '../questions/principal-member-id-for-community.ts';

export class ListMembers extends Task {
	static inCommunity(communityId: string, searchTerm = ''): ListMembers {
		return new ListMembers(communityId, searchTerm);
	}

	private constructor(
		private readonly communityId: string,
		private readonly searchTerm: string,
	) {
		super(`lists members in community "${communityId}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const principalMemberId = await actor.answer(PrincipalMemberIdForCommunity.inCommunity(this.communityId));
		const members = await ListMembersAbility.as(actor).performAs(actor, {
			communityId: this.communityId,
			principalMemberId,
		});
		const normalizedSearch = this.searchTerm.trim().toLowerCase();
		const listedMemberNames = members.map((member) => member.memberName).filter((name) => !normalizedSearch || name.toLowerCase().includes(normalizedSearch));

		await actor.attemptsTo(notes<MemberNotes>().set('listedMemberNames', listedMemberNames));
	}
}
