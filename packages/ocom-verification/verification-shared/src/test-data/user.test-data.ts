import type { ActorDetails } from '../helpers/actor-helpers.ts';
import { actors } from './test-actors.ts';
import { generateObjectId } from './utils.ts';

export interface MockEndUser {
	id: string;
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
	userType: 'end-users';
	schemaVersion: string;
	createdAt: Date;
	updatedAt: Date;
}

function createMockEndUserFromActor(actor: ActorDetails): MockEndUser {
	return {
		id: generateObjectId(),
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
		userType: 'end-users',
		schemaVersion: '1.0.0',
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-01T00:00:00Z'),
	};
}

const users = new Map<string, MockEndUser>(
	Object.values(actors)
		.filter((actor) => actor.externalId)
		.map((actor) => {
			const user = createMockEndUserFromActor(actor);
			return [user.id, user];
		}),
);

export function createMockEndUser(actor: ActorDetails): MockEndUser {
	const user = createMockEndUserFromActor(actor);
	users.set(user.id, user);
	return user;
}

export function getAllMockUsers(): MockEndUser[] {
	return Array.from(users.values());
}
