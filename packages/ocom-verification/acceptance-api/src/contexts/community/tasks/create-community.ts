import { type Actor, notes, Task } from '@serenity-js/core';
import { GraphQLClient } from '../../../shared/abilities/graphql-client.ts';
import { COMMUNITY_CREATE_MUTATION, GET_COMMUNITY_QUERY } from '../../../shared/graphql/community-operations.ts';
import type { CommunityDetails, CommunityNotes } from '../abilities/community-types.ts';

export class CreateCommunity extends Task {
	static withName(name: string) {
		return new CreateCommunity({ name });
	}

	static with(details: CommunityDetails) {
		return new CreateCommunity(details);
	}

	private constructor(private readonly details: CommunityDetails) {
		super(`creates a community named "${details.name}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const graphql = GraphQLClient.as(actor);

		const response = await graphql.execute(COMMUNITY_CREATE_MUTATION, {
			input: { name: this.details.name },
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
		if (communityName !== this.details.name) {
			throw new Error(`API communityCreate returned name "${communityName}", expected "${this.details.name}"`);
		}

		const persistedResponse = await graphql.execute(GET_COMMUNITY_QUERY, {
			id: communityId,
		});
		const persistedData = persistedResponse.data['communityById'] as Record<string, unknown> | undefined;
		if (!persistedData) {
			throw new Error(`Community ${communityId} was not found on re-query; API backend did not persist the community`);
		}
		const persistedName = String(persistedData['name'] ?? '');
		if (persistedName !== this.details.name) {
			throw new Error(`Re-queried community name "${persistedName}" does not match created name "${this.details.name}"`);
		}

		await actor.attemptsTo(notes<CommunityNotes>().set('lastCommunityId', communityId), notes<CommunityNotes>().set('lastCommunityName', communityName), notes<CommunityNotes>().set('lastCommunityStatus', 'SUCCESS'));
	}

	override toString = () => `creates a community named "${this.details.name}"`;
}
