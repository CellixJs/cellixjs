import { actors, END_USER_IDS, provisionMemberPropertyFixture } from '@ocom-verification/verification-shared/test-data';
import { type Actor, notes, Task } from '@serenity-js/core';
import { mongoConnectionString, mongoDbName } from '../../../servers/test-mongo-server.ts';
import type { PropertyE2ENotes } from '../../property/notes/property-notes.ts';
import { BecomePropertyManager } from '../../property/tasks/become-property-manager.ts';
import type { MemberPropertyE2ENotes } from '../notes/member-property-notes.ts';

export const MAYA_MEMBER_NAME = 'Maya Own-Property Member';
export const FOREIGN_MEMBER_NAME = 'Foreign Same-Community Owner';

interface MemberPropertyCommunityIds {
	communityId: string;
	managerMemberId: string;
	adminBasePath: string;
}

const parseAdminBasePath = (path: string): MemberPropertyCommunityIds => {
	const match = path.match(/^\/community\/([a-f0-9]{24})\/admin\/([a-f0-9]{24})$/i);
	const communityId = match?.[1];
	const managerMemberId = match?.[2];
	if (!communityId || !managerMemberId) {
		throw new Error(`Expected the manager setup to record an admin portal path, but got "${path}"`);
	}
	return { communityId, managerMemberId, adminBasePath: path };
};

/** Creates a manager community through the UI and provisions Maya as its own-property member fixture. */
export class EstablishMemberPropertyCommunity extends Task {
	static forOwnPropertyMember(): EstablishMemberPropertyCommunity {
		return new EstablishMemberPropertyCommunity();
	}

	private constructor() {
		super('becomes an accepted own-property member in a member Property community');
	}

	async performAs(actor: Actor): Promise<void> {
		await actor.attemptsTo(BecomePropertyManager());
		const adminBasePath = await actor.answer(notes<PropertyE2ENotes>().get('adminBasePath'));
		const community = parseAdminBasePath(adminBasePath);
		const ownMember = await provisionMemberPropertyFixture(
			{ connectionString: mongoConnectionString(), dbName: mongoDbName },
			{
				communityId: community.communityId,
				endUserId: END_USER_IDS.communityMember,
				memberName: MAYA_MEMBER_NAME,
				firstName: actors.CommunityMember.givenName,
				lastName: actors.CommunityMember.familyName,
				accountStatus: 'ACCEPTED',
				canEditOwnProperty: true,
				canManageProperties: false,
			},
		);
		await actor.attemptsTo(
			notes<MemberPropertyE2ENotes>().set('visitor', 'own-editor'),
			notes<MemberPropertyE2ENotes>().set('communityId', community.communityId),
			notes<MemberPropertyE2ENotes>().set('managerMemberId', community.managerMemberId),
			notes<MemberPropertyE2ENotes>().set('ownMemberId', ownMember.memberId),
			notes<MemberPropertyE2ENotes>().set('routeMemberId', ownMember.memberId),
			notes<MemberPropertyE2ENotes>().set('memberBasePath', `/community/${community.communityId}/member/${ownMember.memberId}`),
			notes<MemberPropertyE2ENotes>().set('adminBasePath', community.adminBasePath),
			notes<MemberPropertyE2ENotes>().set('memberPropertyIds', {}),
		);
	}
}
