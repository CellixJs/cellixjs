import type { ActorDetails } from '../helpers/actor-helpers.ts';

/**
 * Predefined test actors used across acceptance and e2e tests.
 * Each represents a persona the Screenplay-pattern actors assume.
 */
export const TestActors = {
	/**
	 * An authenticated community owner who creates and manages communities.
	 */
	CommunityOwner: {
		name: 'CommunityOwner',
		externalId: 'aaaaaaaa-bbbb-1ccc-9ddd-eeeeeeeeee01',
		email: 'owner@test.example',
		givenName: 'Test',
		familyName: 'Owner',
	} satisfies ActorDetails,

	/**
	 * An authenticated end-user who joins communities.
	 */
	CommunityMember: {
		name: 'CommunityMember',
		externalId: 'aaaaaaaa-bbbb-1ccc-9ddd-eeeeeeeeee02',
		email: 'member@test.example',
		givenName: 'Test',
		familyName: 'Member',
	} satisfies ActorDetails,

	/**
	 * An unauthenticated visitor.
	 */
	Guest: {
		name: 'Guest',
		externalId: '',
		email: '',
		givenName: 'Guest',
		familyName: '',
	} satisfies ActorDetails,
} as const;
