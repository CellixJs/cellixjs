import type { Community } from '@ocom/data-sources-mongoose-models/community';
import { END_USER_IDS } from './end-users.ts';

export const COMMUNITY_IDS = {
	riverside: 'b00000000000000000000001',
} as const;

export const communities = [
	{
		_id: COMMUNITY_IDS.riverside,
		name: 'Riverside Community',
		domain: 'riverside',
		whiteLabelDomain: '',
		handle: 'riverside',
		createdBy: END_USER_IDS.testUser,
		schemaVersion: '1.0.0',
		version: 0,
		createdAt: new Date('2024-02-01T00:00:00Z'),
		updatedAt: new Date('2024-02-01T00:00:00Z'),
	},
] as unknown as Community[];
