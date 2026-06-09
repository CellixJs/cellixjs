import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { COMMUNITY_CREATE_MUTATION, GET_COMMUNITY_QUERY } from '../graphql/community-operations.ts';

/** Community details accepted by API verification flows. */
interface CreateCommunityDetails {
	name: string;
}

/** Result returned by the API community creation flow. */
interface CreateCommunityResult {
	id?: string;
	name: string;
}

/** Handler that performs community creation for an API actor. */
type CreateCommunityHandler = (actor: Actor, details: CreateCommunityDetails) => Promise<CreateCommunityResult>;

/**
 * Serenity ability that creates communities through the API verification server.
 */
export class CreateCommunity extends Ability {
	constructor(private readonly handler: CreateCommunityHandler) {
		super();
	}

	static using(handler: CreateCommunityHandler): CreateCommunity {
		return new CreateCommunity(handler);
	}

	async performAs(actor: Actor, details: CreateCommunityDetails): Promise<CreateCommunityResult> {
		return await this.handler(actor, details);
	}
}

export function createCommunityAbility(): CreateCommunity {
	return CreateCommunity.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(COMMUNITY_CREATE_MUTATION, {
			input: { name: details.name },
		});

		const mutationResult = response.data['communityCreate'] as Record<string, unknown>;
		const status = mutationResult?.['status'] as Record<string, unknown> | undefined;
		const community = mutationResult?.['community'] as Record<string, unknown> | undefined;

		if (status?.['success'] !== true) {
			throw new Error(String(status?.['errorMessage'] ?? 'Failed to create community'));
		}

		const communityId = String(community?.['id'] ?? '');
		const communityName = String(community?.['name'] ?? '');

		if (!communityId) {
			throw new Error('API communityCreate returned a community without an id');
		}
		if (communityName !== details.name) {
			throw new Error(`API communityCreate returned name "${communityName}", expected "${details.name}"`);
		}

		const persistedResponse = await graphql.execute(GET_COMMUNITY_QUERY, {
			id: communityId,
		});
		const persistedData = persistedResponse.data['communityById'] as Record<string, unknown> | undefined;
		if (!persistedData) {
			throw new Error(`Community ${communityId} was not found on re-query; API backend did not persist the community`);
		}
		const persistedName = String(persistedData['name'] ?? '');
		if (persistedName !== details.name) {
			throw new Error(`Re-queried community name "${persistedName}" does not match created name "${details.name}"`);
		}

		return {
			id: communityId,
			name: communityName,
		};
	});
}
