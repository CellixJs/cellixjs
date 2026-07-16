import { actors, type TestActor } from '../test-actors.ts';
import { COMMUNITY_IDS } from './communities.ts';
import { END_USER_ROLE_IDS } from './end-user-roles.ts';
import { END_USER_IDS } from './end-users.ts';

export interface MemberSeedDocument {
	_id: string;
	memberName: string;
	community: string;
	role: string;
	accounts: Array<{
		firstName: string;
		lastName: string;
		user: string;
		statusCode: 'ACCEPTED';
		createdBy: string;
	}>;
	customViews: never[];
	profile: {
		name: string;
		email: string;
	};
	schemaVersion: string;
	createdAt: Date;
	updatedAt: Date;
}

export const MEMBER_IDS = {
	/** Member of the seeded community whose role grants `canManageCommunitySettings`. */
	seededAdminMember: 'd00000000000000000000001',
	/** Member of the seeded community whose role grants no community permissions. */
	seededPlainMember: 'd00000000000000000000002',
	/** Admin member of the *other* community, used for cross-community permission checks. */
	otherCommunityAdminMember: 'd00000000000000000000003',
} as const;

const seedTimestamp = new Date('2024-01-01T00:00:00Z');

function createMemberSeedDocument(id: string, memberName: string, communityId: string, roleId: string, endUserId: string, actor: TestActor): MemberSeedDocument {
	return {
		_id: id,
		memberName,
		community: communityId,
		role: roleId,
		accounts: [
			{
				firstName: actor.givenName,
				lastName: actor.familyName,
				user: endUserId,
				statusCode: 'ACCEPTED',
				createdBy: endUserId,
			},
		],
		customViews: [],
		profile: {
			name: memberName,
			email: actor.email,
		},
		schemaVersion: '1.0.0',
		createdAt: seedTimestamp,
		updatedAt: seedTimestamp,
	};
}

export const members: MemberSeedDocument[] = [
	createMemberSeedDocument(MEMBER_IDS.seededAdminMember, 'Seeded Admin Member', COMMUNITY_IDS.seededCommunity, END_USER_ROLE_IDS.seededAdminRole, END_USER_IDS.communityOwner, actors.CommunityOwner),
	createMemberSeedDocument(MEMBER_IDS.seededPlainMember, 'Seeded Plain Member', COMMUNITY_IDS.seededCommunity, END_USER_ROLE_IDS.seededMemberRole, END_USER_IDS.communityMember, actors.CommunityMember),
	createMemberSeedDocument(MEMBER_IDS.otherCommunityAdminMember, 'Other Community Admin Member', COMMUNITY_IDS.otherCommunity, END_USER_ROLE_IDS.otherCommunityAdminRole, END_USER_IDS.communityMember, actors.CommunityMember),
];
