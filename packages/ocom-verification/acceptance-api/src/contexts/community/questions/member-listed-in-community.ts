import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { MEMBERS_BY_COMMUNITY_QUERY } from '../../../shared/graphql/member-operations.ts';

export class MemberListedInCommunity extends Question<Promise<boolean>> {
	static named(memberName: string, communityId: string): MemberListedInCommunity {
		return new MemberListedInCommunity(memberName, communityId);
	}

	private constructor(
		private readonly memberName: string,
		private readonly communityId: string,
	) {
		super(`whether member "${memberName}" is listed in community "${communityId}"`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<boolean> {
		const graphql = GraphQLClient.as(actor as unknown as Actor);
		const response = await graphql.execute(MEMBERS_BY_COMMUNITY_QUERY, { communityId: this.communityId });
		const members = response.data?.['membersByCommunityId'];
		return Array.isArray(members) && members.some((member) => (member as Record<string, unknown>)['memberName'] === this.memberName);
	}
}
