import { type Actor, notes, Task } from '@serenity-js/core';
import { type MemberProfileUpdate, UpdateMemberProfile as UpdateMemberProfileAbility } from '../../../shared/abilities/update-member-profile.ts';
import type { MemberNotes } from '../notes/member-notes.ts';
import { PrincipalMemberIdForCommunity } from '../questions/principal-member-id-for-community.ts';

interface UpdateMemberProfileTaskDetails {
	profile: MemberProfileUpdate;
	memberId?: string;
	communityId?: string;
}

export class UpdateMember extends Task {
	static with(details: UpdateMemberProfileTaskDetails) {
		return new UpdateMember(details);
	}

	private constructor(private readonly details: UpdateMemberProfileTaskDetails) {
		super('updates a member profile');
	}

	async performAs(actor: Actor): Promise<void> {
		const memberId = this.details.memberId ?? (await actor.answer(notes<MemberNotes>().get('lastMemberId')));
		if (!memberId) {
			throw new Error('Cannot update member profile because no member id is available in notes');
		}

		const communityId = this.details.communityId ?? (await actor.answer(notes<MemberNotes>().get('lastMemberCommunityId')));
		if (!communityId) {
			throw new Error('Cannot update member profile because no community id is available in notes');
		}

		const principalMemberId = await actor.answer(PrincipalMemberIdForCommunity.inCommunity(communityId));
		const result = await UpdateMemberProfileAbility.as(actor).performAs(actor, {
			memberId,
			profile: this.details.profile,
			communityId,
			principalMemberId,
		});

		await actor.attemptsTo(
			notes<MemberNotes>().set('lastMemberProfileEmail', result.profile?.email),
			notes<MemberNotes>().set('lastExpectedMemberProfileEmail', this.details.profile.email),
			notes<MemberNotes>().set('lastMemberStatus', 'SUCCESS'),
		);
	}

	override toString = () => 'updates a member profile';
}
