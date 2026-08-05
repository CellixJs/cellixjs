import { type Actor, notes, Task } from '@serenity-js/core';
import { UpdateMemberRole as UpdateMemberRoleAbility } from '../../../shared/abilities/update-member-role.ts';
import type { MemberNotes } from '../notes/member-notes.ts';
import { PrincipalMemberIdForCommunity } from '../questions/principal-member-id-for-community.ts';

export class UpdateMemberRole extends Task {
	static with(roleId: string, communityId: string): UpdateMemberRole {
		return new UpdateMemberRole(roleId, communityId);
	}

	private constructor(
		private readonly roleId: string,
		private readonly communityId: string,
	) {
		super('updates a member role');
	}

	async performAs(actor: Actor): Promise<void> {
		const memberId = await actor.answer(notes<MemberNotes>().get('lastMemberId'));
		const principalMemberId = await actor.answer(PrincipalMemberIdForCommunity.inCommunity(this.communityId));
		const roleName = await UpdateMemberRoleAbility.as(actor).performAs(actor, {
			memberId,
			roleId: this.roleId,
			communityId: this.communityId,
			principalMemberId,
		});
		await actor.attemptsTo(notes<MemberNotes>().set('lastMemberRoleName', roleName));
	}
}
