import type { EndUser } from '@ocom/data-sources-mongoose-models/user/end-user';

export const END_USER_IDS = {
	testUser: 'a00000000000000000000001',
	janeSmith: 'a00000000000000000000002',
} as const;

export const endUsers = [
	{
		_id: END_USER_IDS.testUser,
		userType: 'end-users',
		externalId: '00000000-0000-4000-8000-000000000001',
		displayName: 'Test User',
		email: 'test@example.com',
		personalInformation: {
			identityDetails: {
				lastName: 'User',
				legalNameConsistsOfOneName: false,
				restOfName: 'Test',
			},
			contactInformation: {
				email: 'test@example.com',
			},
		},
		accessBlocked: false,
		tags: [],
		schemaVersion: '1.0.0',
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-01T00:00:00Z'),
	},
	{
		_id: END_USER_IDS.janeSmith,
		userType: 'end-users',
		externalId: '00000000-0000-4000-8000-000000000002',
		displayName: 'Jane Smith',
		email: 'jane@example.com',
		personalInformation: {
			identityDetails: {
				lastName: 'Smith',
				legalNameConsistsOfOneName: false,
				restOfName: 'Jane',
			},
			contactInformation: {
				email: 'jane@example.com',
			},
		},
		accessBlocked: false,
		tags: [],
		schemaVersion: '1.0.0',
		createdAt: new Date('2024-01-15T00:00:00Z'),
		updatedAt: new Date('2024-01-15T00:00:00Z'),
	},
] as unknown as EndUser[];
