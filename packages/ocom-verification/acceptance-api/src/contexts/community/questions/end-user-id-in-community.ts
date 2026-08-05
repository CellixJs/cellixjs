import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { END_USERS_BY_COMMUNITY_QUERY } from '../../../shared/graphql/member-operations.ts';

export class EndUserIdInCommunity extends Question<Promise<string>> {
	constructor(
		private readonly communityId: string,
		private readonly displayName: string,
	) {
		super(`end user "${displayName}" in community "${communityId}"`);
	}

	static withDisplayName(communityId: string, displayName: string): EndUserIdInCommunity {
		return new EndUserIdInCommunity(communityId, displayName);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const graphql = GraphQLClient.as(actor as unknown as Actor);
		const response = await graphql.execute(END_USERS_BY_COMMUNITY_QUERY, { communityId: this.communityId });
		const endUsers = (response.data?.['endUsersByCommunityId'] as Array<Record<string, unknown>> | undefined) ?? [];
		const endUser = endUsers.find((candidate) => String(candidate['displayName'] ?? '') === this.displayName);
		if (!endUser?.['id']) {
			throw new Error(`End user "${this.displayName}" is not available in community "${this.communityId}"`);
		}
		return String(endUser['id']);
	}
}
