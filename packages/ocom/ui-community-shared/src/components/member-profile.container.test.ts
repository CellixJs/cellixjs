import { describe, expect, it } from 'vitest';
import { buildMemberProfileSaveVariables } from './member-profile.container.tsx';

describe('buildMemberProfileSaveVariables', () => {
	it('builds a self-profile mutation payload for community members', () => {
		const result = buildMemberProfileSaveVariables({
			mode: 'self',
			communityId: 'community-1',
			values: {
				name: 'Jane Doe',
				email: 'jane@example.com',
				bio: 'Hello there',
				showInterests: true,
				showEmail: true,
				showProfile: false,
				showLocation: true,
				showProperties: false,
			},
		});

		expect(result).toEqual({
			variables: {
				communityId: 'community-1',
				input: {
					name: 'Jane Doe',
					email: 'jane@example.com',
					bio: 'Hello there',
					interests: [],
					visibility: {
						showEmail: true,
						showBio: false,
						showInterests: true,
						showProfile: false,
						showLocation: true,
						showProperties: false,
					},
				},
			},
		});
	});

	it('builds an admin mutation payload for a specific member', () => {
		const result = buildMemberProfileSaveVariables({
			mode: 'admin',
			memberObjectId: 'member-1',
			values: {
				name: 'Jane Doe',
				email: 'jane@example.com',
				bio: 'Hello there',
				showInterests: true,
				showEmail: true,
				showProfile: false,
				showLocation: true,
				showProperties: false,
			},
		});

		expect(result).toEqual({
			variables: {
				input: {
					memberId: 'member-1',
					profile: {
						name: 'Jane Doe',
						email: 'jane@example.com',
						bio: 'Hello there',
						showInterests: true,
						showEmail: true,
						showProfile: false,
						showLocation: true,
						showProperties: false,
					},
				},
			},
		});
	});
});
