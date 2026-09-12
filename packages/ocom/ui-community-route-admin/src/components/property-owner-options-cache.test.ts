import { InMemoryCache } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { AdminPropertiesOwnerOptionsDocument } from '../generated.tsx';
import { evictPropertyOwnerOptions } from './property-owner-options-cache.ts';

const ownerOptions = (id: string, memberName: string) => ({
	propertyOwnerOptions: [{ __typename: 'PropertyOwnerOption' as const, id, memberName }],
});

describe('evictPropertyOwnerOptions', () => {
	it('evicts only the requested community owner options', () => {
		const cache = new InMemoryCache();
		cache.writeQuery({
			query: AdminPropertiesOwnerOptionsDocument,
			variables: { communityId: 'community-1' },
			data: ownerOptions('member-1', 'First Owner'),
		});
		cache.writeQuery({
			query: AdminPropertiesOwnerOptionsDocument,
			variables: { communityId: 'community-2' },
			data: ownerOptions('member-2', 'Second Owner'),
		});

		expect(evictPropertyOwnerOptions(cache, 'community-1')).toBe(true);
		expect(
			cache.readQuery({
				query: AdminPropertiesOwnerOptionsDocument,
				variables: { communityId: 'community-1' },
			}),
		).toBeNull();
		expect(
			cache.readQuery({
				query: AdminPropertiesOwnerOptionsDocument,
				variables: { communityId: 'community-2' },
			}),
		).toEqual(ownerOptions('member-2', 'Second Owner'));
	});

	it('does not evict without a community id', () => {
		const cache = new InMemoryCache();
		cache.writeQuery({
			query: AdminPropertiesOwnerOptionsDocument,
			variables: { communityId: 'community-1' },
			data: ownerOptions('member-1', 'First Owner'),
		});

		expect(evictPropertyOwnerOptions(cache, '')).toBe(false);
		expect(
			cache.readQuery({
				query: AdminPropertiesOwnerOptionsDocument,
				variables: { communityId: 'community-1' },
			}),
		).toEqual(ownerOptions('member-1', 'First Owner'));
	});
});
