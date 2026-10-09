import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { COMMUNITY_UPDATE_SETTINGS_MUTATION } from '../graphql/community-operations.ts';

/** Community settings fields accepted by the API update flow. */
export interface UpdateCommunityDetails {
	id: string;
	name?: string;
	domain?: string;
	whiteLabelDomain?: string;
	handle?: string;
}

/** Community fields returned by the API update flow. */
export interface UpdateCommunityResult {
	id: string;
	name: string;
	domain?: string | null;
	whiteLabelDomain?: string | null;
	handle?: string | null;
}

/** Handler that performs a community settings update for an API actor. */
type UpdateCommunityHandler = (actor: Actor, details: UpdateCommunityDetails) => Promise<UpdateCommunityResult>;

/**
 * Serenity ability that updates community settings through the API verification server.
 */
export class UpdateCommunity extends Ability {
	constructor(private readonly handler: UpdateCommunityHandler) {
		super();
	}

	static using(handler: UpdateCommunityHandler): UpdateCommunity {
		return new UpdateCommunity(handler);
	}

	async performAs(actor: Actor, details: UpdateCommunityDetails): Promise<UpdateCommunityResult> {
		return await this.handler(actor, details);
	}
}

export function updateCommunityAbility(): UpdateCommunity {
	return UpdateCommunity.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor);
		const { id, ...fields } = details;
		const response = await graphql.execute(COMMUNITY_UPDATE_SETTINGS_MUTATION, {
			input: { id, ...fields },
		});

		const mutationResult = response.data['communityUpdateSettings'] as Record<string, unknown>;
		const status = mutationResult?.['status'] as Record<string, unknown> | undefined;
		const community = mutationResult?.['community'] as Record<string, unknown> | undefined;

		if (status?.['success'] !== true) {
			throw new Error(String(status?.['errorMessage'] ?? 'Failed to update community settings'));
		}

		const communityId = String(community?.['id'] ?? '');
		if (!communityId) {
			throw new Error('API communityUpdateSettings returned a community without an id');
		}

		return {
			id: communityId,
			name: String(community?.['name'] ?? ''),
			domain: (community?.['domain'] as string | null | undefined) ?? null,
			whiteLabelDomain: (community?.['whiteLabelDomain'] as string | null | undefined) ?? null,
			handle: (community?.['handle'] as string | null | undefined) ?? null,
		};
	});
}
