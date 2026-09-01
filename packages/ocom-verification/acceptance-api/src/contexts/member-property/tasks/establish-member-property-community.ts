import { actors, END_USER_IDS } from '@ocom-verification/verification-shared/test-data';
import { type Actor, notes, Task } from '@serenity-js/core';
import { setActorContext, setActorToken, userTokenFor } from '../../../shared/abilities/actor-auth.ts';
import { ProvisionMemberPropertyFixture as ProvisionMemberPropertyFixtureAbility } from '../../../shared/abilities/provision-member-property-fixture.ts';
import type { PropertyNotes } from '../../property/notes/property-notes.ts';
import { BecomePropertyManager } from '../../property/tasks/become-property-manager.ts';
import { initialiseMemberPropertyNotes } from './member-property-context.ts';

const MAYA_MEMBER_NAME = 'Maya Own-Property Member';

/**
 * Creates a fresh community through the existing manager flow, then replaces
 * the acting test principal with an accepted own-property member of it.
 */
export class EstablishMemberPropertyCommunity extends Task {
	static forOwnPropertyMember(): EstablishMemberPropertyCommunity {
		return new EstablishMemberPropertyCommunity();
	}

	private constructor() {
		super('becomes an accepted own-property member of a member Property community');
	}

	async performAs(actor: Actor): Promise<void> {
		setActorToken(actor.name, userTokenFor(actors.CommunityOwner.name));
		await actor.attemptsTo(BecomePropertyManager.ofANewCommunity());

		const communityId = await actor.answer(notes<PropertyNotes>().get('activeCommunityId'));
		const communityName = await actor.answer(notes<PropertyNotes>().get('activeCommunityName'));
		const managerMemberId = await actor.answer(notes<PropertyNotes>().get('actingMemberId'));
		if (!communityId || !managerMemberId) {
			throw new Error('The manager arrangement did not return a community and member id');
		}

		const ownMember = await ProvisionMemberPropertyFixtureAbility.as(actor).performAs(actor, {
			communityId,
			endUserId: END_USER_IDS.communityMember,
			memberName: MAYA_MEMBER_NAME,
			firstName: actors.CommunityMember.givenName,
			lastName: actors.CommunityMember.familyName,
			accountStatus: 'ACCEPTED',
			canEditOwnProperty: true,
			canManageProperties: false,
		});

		setActorToken(actor.name, userTokenFor(actors.CommunityMember.name));
		setActorContext(actor.name, { memberId: ownMember.memberId, communityId });
		await initialiseMemberPropertyNotes(actor, { communityId, communityName, managerMemberId, actingMemberId: ownMember.memberId });
	}
}
