import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { MEMBERS_FOR_CURRENT_END_USER_QUERY } from '../../../shared/graphql/member-operations.ts';

interface CurrentEndUserMemberShape {
	id?: string;
	community?: {
		id?: string;
	};
}

type ExecuteWithRequestOptions = <TData extends Record<string, unknown> = Record<string, unknown>>(query: string, variables?: Record<string, unknown>, options?: { headers?: Record<string, string> }) => Promise<{ data: TData }>;

export class HasNoMemberForCommunity extends Question<Promise<boolean>> {
	static authenticatedWith(authorizationToken: string, communityId: string): HasNoMemberForCommunity {
		return new HasNoMemberForCommunity(authorizationToken, communityId);
	}

	private constructor(
		private readonly authorizationToken: string,
		private readonly communityId: string,
	) {
		super(`whether the authenticated end user has no member in community "${communityId}"`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<boolean> {
		const graphql = GraphQLClient.as(actor as unknown as Actor) as GraphQLClient & { execute: ExecuteWithRequestOptions };
		const response = await graphql.execute(MEMBERS_FOR_CURRENT_END_USER_QUERY, undefined, {
			headers: { Authorization: `Bearer ${this.authorizationToken}` },
		});
		const members = (response.data?.['membersForCurrentEndUser'] as CurrentEndUserMemberShape[] | undefined) ?? [];

		return !members.some((member) => String(member.community?.id ?? '') === String(this.communityId));
	}
}
