import { actors, END_USER_IDS, type MemberPropertyFixture } from '@ocom-verification/verification-shared/test-data';
import { type Actor, Task } from '@serenity-js/core';
import { setActorContext, setActorToken, userTokenFor } from '../../../shared/abilities/actor-auth.ts';
import { ProvisionMemberPropertyFixture as ProvisionMemberPropertyFixtureAbility } from '../../../shared/abilities/provision-member-property-fixture.ts';
import { initialiseMemberPropertyNotes, type MemberPropertyCommunityContext } from './member-property-context.ts';

export type MemberPropertyVisitor = 'no-permission' | 'no-role' | 'created' | 'rejected' | 'guest';

const visitorFixture = (actorName: string, visitor: Exclude<MemberPropertyVisitor, 'guest'>, communityId: string): MemberPropertyFixture => {
	const accountStatus = visitor === 'created' ? 'CREATED' : visitor === 'rejected' ? 'REJECTED' : 'ACCEPTED';
	return {
		communityId,
		endUserId: END_USER_IDS.otherCommunityOwner,
		memberName: `${actorName} Member Property Visitor`,
		firstName: actors.OtherCommunityOwner.givenName,
		lastName: actors.OtherCommunityOwner.familyName,
		accountStatus,
		canEditOwnProperty: visitor !== 'no-permission' && visitor !== 'no-role',
		canManageProperties: false,
		hasRole: visitor !== 'no-role',
	};
};

/** Makes an actor a deliberately ineligible principal in Maya's community. */
export class BecomeMemberPropertyVisitor extends Task {
	static inCommunity(visitor: MemberPropertyVisitor, community: MemberPropertyCommunityContext): BecomeMemberPropertyVisitor {
		return new BecomeMemberPropertyVisitor(visitor, community);
	}

	private constructor(
		private readonly visitor: MemberPropertyVisitor,
		private readonly community: MemberPropertyCommunityContext,
	) {
		super(`becomes a ${visitor} member Property visitor`);
	}

	async performAs(actor: Actor): Promise<void> {
		let memberId = '';
		if (this.visitor === 'guest') {
			setActorToken(actor.name, null);
			setActorContext(actor.name, null);
		} else {
			const fixture = visitorFixture(actor.name, this.visitor, this.community.communityId);
			const member = await ProvisionMemberPropertyFixtureAbility.as(actor).performAs(actor, fixture);
			memberId = member.memberId;
			setActorToken(actor.name, userTokenFor(actors.OtherCommunityOwner.name));
			setActorContext(actor.name, { memberId, communityId: this.community.communityId });
		}

		await initialiseMemberPropertyNotes(actor, { ...this.community, actingMemberId: memberId });
	}
}

/** Configures an actor to use the manager membership already provisioned for Maya's community. */
export class BecomeMemberPropertyManager extends Task {
	static inCommunity(community: MemberPropertyCommunityContext): BecomeMemberPropertyManager {
		return new BecomeMemberPropertyManager(community);
	}

	private constructor(private readonly community: MemberPropertyCommunityContext) {
		super('becomes the property manager of the member Property community');
	}

	async performAs(actor: Actor): Promise<void> {
		setActorToken(actor.name, userTokenFor(actors.CommunityOwner.name));
		setActorContext(actor.name, { memberId: this.community.managerMemberId, communityId: this.community.communityId });
		await initialiseMemberPropertyNotes(actor, { ...this.community, actingMemberId: this.community.managerMemberId });
	}
}
