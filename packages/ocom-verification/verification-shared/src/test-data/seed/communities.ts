import { END_USER_IDS } from './end-users.ts';

export interface CommunitySeedDocument {
	_id: string;
	name: string;
	createdBy: string;
	schemaVersion: string;
	createdAt: Date;
	updatedAt: Date;
}

export const COMMUNITY_IDS = {
	seededCommunity: 'f00000000000000000000001',
	otherCommunity: 'f00000000000000000000002',
} as const;

/**
 * Baseline settings of the seeded community. Update scenarios assert against
 * these values when verifying that a blocked update did not modify the community.
 *
 * The `domain`, `whiteLabelDomain`, and `handle` fields are intentionally left
 * unset so update scenarios can set them without tripping the partial unique
 * indexes on those fields.
 */
export const SEEDED_COMMUNITY = {
	id: COMMUNITY_IDS.seededCommunity,
	name: 'Seeded Community',
} as const;

export const OTHER_COMMUNITY = {
	id: COMMUNITY_IDS.otherCommunity,
	name: 'Other Community',
} as const;

const seedTimestamp = new Date('2024-01-01T00:00:00Z');

export const communities: CommunitySeedDocument[] = [
	{
		_id: SEEDED_COMMUNITY.id,
		name: SEEDED_COMMUNITY.name,
		createdBy: END_USER_IDS.communityOwner,
		schemaVersion: '1.0.0',
		createdAt: seedTimestamp,
		updatedAt: seedTimestamp,
	},
	{
		_id: OTHER_COMMUNITY.id,
		name: OTHER_COMMUNITY.name,
		createdBy: END_USER_IDS.communityMember,
		schemaVersion: '1.0.0',
		createdAt: seedTimestamp,
		updatedAt: seedTimestamp,
	},
];
