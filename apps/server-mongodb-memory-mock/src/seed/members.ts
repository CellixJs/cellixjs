import type { Member } from '@ocom/data-sources-mongoose-models/member';
import { COMMUNITY_IDS } from './communities.ts';
import { END_USER_IDS } from './end-users.ts';
import { ROLE_IDS } from './roles.ts';

export const MEMBER_IDS = {
	testUserMember: 'd00000000000000000000001',
	janeSmithMember: 'd00000000000000000000002',
} as const;

export const members = [
	{
		_id: MEMBER_IDS.testUserMember,
		memberName: 'Test User',
		community: COMMUNITY_IDS.riverside,
		role: ROLE_IDS.admin,
		accounts: [
			{
				firstName: 'Test',
				lastName: 'User',
				user: END_USER_IDS.testUser,
				statusCode: 'ACCEPTED',
				createdBy: END_USER_IDS.testUser,
				createdAt: new Date('2024-02-01T00:00:00Z'),
				updatedAt: new Date('2024-02-01T00:00:00Z'),
				version: 0,
			},
		],
		customViews: [],
		profile: {
			name: 'Test User',
			email: 'test@example.com',
			bio: 'Community admin and test user.',
			avatarDocumentId: '',
			interests: ['community-management', 'testing'],
			showInterests: true,
			showEmail: true,
			showProfile: true,
			showLocation: true,
			showProperties: true,
		},
		schemaVersion: '1.0.0',
		version: 0,
		createdAt: new Date('2024-02-01T00:00:00Z'),
		updatedAt: new Date('2024-02-01T00:00:00Z'),
	},
	{
		_id: MEMBER_IDS.janeSmithMember,
		memberName: 'Jane Smith',
		community: COMMUNITY_IDS.riverside,
		role: ROLE_IDS.member,
		accounts: [
			{
				firstName: 'Jane',
				lastName: 'Smith',
				user: END_USER_IDS.janeSmith,
				statusCode: 'ACCEPTED',
				createdBy: END_USER_IDS.testUser,
				createdAt: new Date('2024-02-15T00:00:00Z'),
				updatedAt: new Date('2024-02-15T00:00:00Z'),
				version: 0,
			},
		],
		customViews: [],
		profile: {
			name: 'Jane Smith',
			email: 'jane@example.com',
			bio: 'Riverside community member.',
			avatarDocumentId: '',
			interests: ['gardening', 'community-events'],
			showInterests: true,
			showEmail: false,
			showProfile: true,
			showLocation: false,
			showProperties: true,
		},
		schemaVersion: '1.0.0',
		version: 0,
		createdAt: new Date('2024-02-15T00:00:00Z'),
		updatedAt: new Date('2024-02-15T00:00:00Z'),
	},
] as unknown as Member[];
