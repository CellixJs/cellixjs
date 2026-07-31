import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type UsesAbilities } from '@serenity-js/core';
import { CURRENT_COMMUNITY_QUERY, GET_COMMUNITY_QUERY } from '../graphql/community-operations.ts';

/** Community fields returned by the API read flows. */
export interface CommunityReadResult {
	id: string;
	name: string;
	domain?: string | null;
	whiteLabelDomain?: string | null;
	handle?: string | null;
}

/**
 * Serenity ability that reads communities through the API verification server.
 */
export class QueryCommunity extends Ability {
	// biome-ignore lint/complexity/noUselessConstructor: widens Serenity's protected Ability constructor so the world cast can instantiate this ability
	constructor() {
		super();
	}

	/** Fetch a community by id. Returns `null` when the community does not exist. */
	async byId(actor: UsesAbilities, id: string): Promise<CommunityReadResult | null> {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(GET_COMMUNITY_QUERY, { id });
		return toCommunityReadResult(response.data['communityById'] as Record<string, unknown> | null | undefined);
	}

	/** Fetch the current community resolved from the actor's principal hints. */
	async current(actor: UsesAbilities): Promise<CommunityReadResult | null> {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(CURRENT_COMMUNITY_QUERY);
		return toCommunityReadResult(response.data['currentCommunity'] as Record<string, unknown> | null | undefined);
	}
}

function toCommunityReadResult(community: Record<string, unknown> | null | undefined): CommunityReadResult | null {
	if (!community) {
		return null;
	}
	return {
		id: String(community['id'] ?? ''),
		name: String(community['name'] ?? ''),
		domain: (community['domain'] as string | null | undefined) ?? null,
		whiteLabelDomain: (community['whiteLabelDomain'] as string | null | undefined) ?? null,
		handle: (community['handle'] as string | null | undefined) ?? null,
	};
}

export function queryCommunityAbility(): QueryCommunity {
	return new QueryCommunity();
}
