import type { ApolloCache } from '@apollo/client';

export const evictPropertyOwnerOptions = (cache: ApolloCache<unknown>, communityId: string): boolean => {
	if (!communityId) {
		return false;
	}
	return cache.evict({
		id: 'ROOT_QUERY',
		fieldName: 'propertyOwnerOptions',
		args: { communityId },
	});
};
