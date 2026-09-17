import type { DataSources } from '@ocom/persistence';
import { actorCanManageCommunityBilling } from './resolve-community-actor.ts';

export interface CommunityQueryCanManageBillingCommand {
	communityId: string;
	endUserExternalId: string | undefined;
}

/**
 * Whether the acting end user may see this community's billing data. Read paths use
 * this to hide finance fields rather than failing the whole community query, since a
 * member without billing rights may still legitimately read the rest of the community.
 *
 * Resolving the answer costs several queries, and both `Community.finance` and
 * `Community.paymentInstrument` need it for every community in a result set, so the
 * answer is memoised. Application services are built per request, so the cache lives
 * and dies with the request.
 */
export const queryCanManageBilling = (dataSources: DataSources, cache: Map<string, Promise<boolean>> = new Map()) => {
	return async (command: CommunityQueryCanManageBillingCommand): Promise<boolean> => {
		const key = `${command.endUserExternalId ?? ''}:${command.communityId}`;
		const cached = cache.get(key);
		if (cached) {
			return await cached;
		}
		const pending = actorCanManageCommunityBilling(dataSources, command.communityId, command.endUserExternalId);
		cache.set(key, pending);
		try {
			return await pending;
		} catch (error) {
			// a failed lookup must not be cached as an answer
			cache.delete(key);
			throw error;
		}
	};
};
