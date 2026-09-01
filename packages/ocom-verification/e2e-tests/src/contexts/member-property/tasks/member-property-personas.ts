import { actors, END_USER_IDS, provisionMemberPropertyFixture } from '@ocom-verification/verification-shared/test-data';
import { type Actor, notes, Task } from '@serenity-js/core';
import { mongoConnectionString, mongoDbName } from '../../../servers/test-mongo-server.ts';
import type { MemberPropertyBrowserVisitor, MemberPropertyE2ENotes } from '../notes/member-property-notes.ts';

export type MemberPropertyRouteVisitor = 'no-permission' | 'no-role' | 'nonaccepted' | 'guest' | 'mismatched-route';

interface MemberPropertyCommunityRoute {
	communityId: string;
	managerMemberId: string;
	ownMemberId: string;
	adminBasePath: string;
}

const routeContextFrom = async (actor: Actor): Promise<MemberPropertyCommunityRoute> => ({
	communityId: await actor.answer(notes<MemberPropertyE2ENotes>().get('communityId')),
	managerMemberId: await actor.answer(notes<MemberPropertyE2ENotes>().get('managerMemberId')),
	ownMemberId: await actor.answer(notes<MemberPropertyE2ENotes>().get('ownMemberId')),
	adminBasePath: await actor.answer(notes<MemberPropertyE2ENotes>().get('adminBasePath')),
});

async function recordBrowserVisitor(actor: Actor, visitor: MemberPropertyBrowserVisitor, context: MemberPropertyCommunityRoute, routeMemberId: string): Promise<void> {
	await actor.attemptsTo(
		notes<MemberPropertyE2ENotes>().set('visitor', visitor),
		notes<MemberPropertyE2ENotes>().set('communityId', context.communityId),
		notes<MemberPropertyE2ENotes>().set('managerMemberId', context.managerMemberId),
		notes<MemberPropertyE2ENotes>().set('ownMemberId', context.ownMemberId),
		notes<MemberPropertyE2ENotes>().set('routeMemberId', routeMemberId),
		notes<MemberPropertyE2ENotes>().set('memberBasePath', `/community/${context.communityId}/member/${routeMemberId}`),
		notes<MemberPropertyE2ENotes>().set('adminBasePath', context.adminBasePath),
		notes<MemberPropertyE2ENotes>().set('memberPropertyIds', {}),
	);
}

/** Configures a fresh browser actor to use the manager membership from Maya's community. */
export class BecomeMemberPropertyManager extends Task {
	static inMayaCommunity(maya: Actor): BecomeMemberPropertyManager {
		return new BecomeMemberPropertyManager(maya);
	}

	private constructor(private readonly maya: Actor) {
		super('becomes the property manager of Maya’s member Property community');
	}

	async performAs(actor: Actor): Promise<void> {
		const context = await routeContextFrom(this.maya);
		await recordBrowserVisitor(actor, 'manager', context, context.managerMemberId);
	}
}

/** Configures a browser actor as an ineligible visitor of Maya's member route. */
export class BecomeMemberPropertyRouteVisitor extends Task {
	static inMayaCommunity(visitor: MemberPropertyRouteVisitor, maya: Actor): BecomeMemberPropertyRouteVisitor {
		return new BecomeMemberPropertyRouteVisitor(visitor, maya);
	}

	private constructor(
		private readonly visitor: MemberPropertyRouteVisitor,
		private readonly maya: Actor,
	) {
		super(`becomes a ${visitor} member Property route visitor`);
	}

	async performAs(actor: Actor): Promise<void> {
		const context = await routeContextFrom(this.maya);
		let routeMemberId = context.ownMemberId;
		if (this.visitor === 'no-permission' || this.visitor === 'no-role' || this.visitor === 'nonaccepted') {
			const member = await provisionMemberPropertyFixture(
				{ connectionString: mongoConnectionString(), dbName: mongoDbName },
				{
					communityId: context.communityId,
					endUserId: END_USER_IDS.otherCommunityOwner,
					memberName: `${actor.name} Member Property Visitor`,
					firstName: actors.OtherCommunityOwner.givenName,
					lastName: actors.OtherCommunityOwner.familyName,
					accountStatus: this.visitor === 'nonaccepted' ? 'CREATED' : 'ACCEPTED',
					canEditOwnProperty: false,
					canManageProperties: false,
					hasRole: this.visitor !== 'no-role',
				},
			);
			routeMemberId = member.memberId;
		}
		if (this.visitor === 'mismatched-route') {
			routeMemberId = '65e1a77bcf86cd79943900ff';
		}
		await recordBrowserVisitor(actor, this.visitor, context, routeMemberId);
	}
}
