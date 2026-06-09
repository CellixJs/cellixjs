import { actors, type TestActor } from '../test-actors.ts';

export interface EndUserSeedDocument {
	_id: string;
	userType: 'end-users';
	externalId: string;
	displayName: string;
	email: string;
	personalInformation: {
		identityDetails: {
			lastName: string;
			legalNameConsistsOfOneName: boolean;
			restOfName: string;
		};
		contactInformation: {
			email: string;
		};
	};
	accessBlocked: boolean;
	tags: string[];
	schemaVersion: string;
	createdAt: Date;
	updatedAt: Date;
}

export const END_USER_IDS = {
	communityOwner: 'a00000000000000000000001',
	communityMember: 'a00000000000000000000002',
} as const;

export const endUsers: EndUserSeedDocument[] = [createEndUserSeedDocument(END_USER_IDS.communityOwner, actors.CommunityOwner), createEndUserSeedDocument(END_USER_IDS.communityMember, actors.CommunityMember)];

function createEndUserSeedDocument(id: string, actor: TestActor): EndUserSeedDocument {
	return {
		_id: id,
		userType: 'end-users',
		externalId: actor.externalId,
		displayName: `${actor.givenName} ${actor.familyName}`.trim(),
		email: actor.email,
		personalInformation: {
			identityDetails: {
				lastName: actor.familyName,
				legalNameConsistsOfOneName: false,
				restOfName: actor.givenName,
			},
			contactInformation: {
				email: actor.email,
			},
		},
		accessBlocked: false,
		tags: [],
		schemaVersion: '1.0.0',
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-01T00:00:00Z'),
	};
}
