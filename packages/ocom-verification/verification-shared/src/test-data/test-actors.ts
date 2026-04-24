import type { ActorDetails } from '../helpers/actor-helpers.ts';

export type TestActor = ActorDetails;

const communityOwner: TestActor = {
	name: 'CommunityOwner',
	externalId: 'aaaaaaaa-bbbb-1ccc-9ddd-eeeeeeeeee01',
	email: 'owner@test.example',
	givenName: 'Test',
	familyName: 'Owner',
};

const communityMember: TestActor = {
	name: 'CommunityMember',
	externalId: 'aaaaaaaa-bbbb-1ccc-9ddd-eeeeeeeeee02',
	email: 'member@test.example',
	givenName: 'Test',
	familyName: 'Member',
};

const guest: TestActor = {
	name: 'Guest',
	externalId: '',
	email: '',
	givenName: 'Guest',
	familyName: '',
};

export const actors = {
	CommunityOwner: communityOwner,
	CommunityMember: communityMember,
	Guest: guest,
} as const;

export function getActor(name: string): TestActor {
	const actor = actors[name as keyof typeof actors];
	if (!actor) {
		throw new Error(`Unknown test actor "${name}". Known actors: ${Object.keys(actors).join(', ')}`);
	}
	return actor;
}

export const defaultActor: TestActor = communityOwner;
