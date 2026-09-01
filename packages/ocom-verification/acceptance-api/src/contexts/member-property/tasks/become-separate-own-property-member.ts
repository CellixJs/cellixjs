import { actors, END_USER_IDS } from '@ocom-verification/verification-shared/test-data';
import { type Actor, notes, Task } from '@serenity-js/core';
import { setActorContext, setActorToken, userTokenFor } from '../../../shared/abilities/actor-auth.ts';
import { ProvisionMemberPropertyFixture as ProvisionMemberPropertyFixtureAbility } from '../../../shared/abilities/provision-member-property-fixture.ts';
import type { PropertyNotes } from '../../property/notes/property-notes.ts';
import { BecomePropertyManager } from '../../property/tasks/become-property-manager.ts';
import { initialiseMemberPropertyNotes } from './member-property-context.ts';

const SEPARATE_MEMBER_NAME = 'Quinn Separate Own-Property Member';

/** Arranges an accepted own-property member whose active community differs from Maya's. */
export class BecomeSeparateOwnPropertyMember extends Task {
	static inNewCommunity(): BecomeSeparateOwnPropertyMember {
		return new BecomeSeparateOwnPropertyMember();
	}

	private constructor() {
		super('becomes an accepted own-property member of a separate community');
	}

	async performAs(actor: Actor): Promise<void> {
		setActorToken(actor.name, userTokenFor(actors.OtherCommunityOwner.name));
		await actor.attemptsTo(BecomePropertyManager.ofANewCommunity());
		const communityId = await actor.answer(notes<PropertyNotes>().get('activeCommunityId'));
		const communityName = await actor.answer(notes<PropertyNotes>().get('activeCommunityName'));
		const managerMemberId = await actor.answer(notes<PropertyNotes>().get('actingMemberId'));
		if (!communityId || !managerMemberId) {
			throw new Error('The separate manager arrangement did not return a community and member id');
		}

		const member = await ProvisionMemberPropertyFixtureAbility.as(actor).performAs(actor, {
			communityId,
			endUserId: END_USER_IDS.otherCommunityOwner,
			memberName: SEPARATE_MEMBER_NAME,
			firstName: actors.OtherCommunityOwner.givenName,
			lastName: actors.OtherCommunityOwner.familyName,
			accountStatus: 'ACCEPTED',
			canEditOwnProperty: true,
			canManageProperties: false,
		});
		setActorContext(actor.name, { memberId: member.memberId, communityId });
		await initialiseMemberPropertyNotes(actor, { communityId, communityName, managerMemberId, actingMemberId: member.memberId });
	}
}
