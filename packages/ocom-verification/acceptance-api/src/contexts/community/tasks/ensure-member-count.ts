import { type Actor, Task } from '@serenity-js/core';
import { CreateMember as CreateMemberAbility } from '../../../shared/abilities/create-member.ts';
import { readCommunityMembers } from '../questions/community-billing.ts';
import { requireCommunityId } from '../questions/read-community-note.ts';

export class EnsureMemberCount extends Task {
	static of(count: number) {
		return new EnsureMemberCount(count);
	}

	private constructor(private readonly count: number) {
		super(`makes sure the community has ${count} members`);
	}

	async performAs(actor: Actor): Promise<void> {
		const communityId = await requireCommunityId(actor);
		const members = await readCommunityMembers(actor, communityId);
		for (let index = members.length; index < this.count; index += 1) {
			await CreateMemberAbility.as(actor).performAs(actor, {
				communityId,
				memberName: `Member ${index + 1}`,
			});
		}
	}

	override toString = () => `makes sure the community has ${this.count} members`;
}
