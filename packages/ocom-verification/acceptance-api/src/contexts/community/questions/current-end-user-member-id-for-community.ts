import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { MEMBERS_FOR_CURRENT_END_USER_QUERY } from '../../../shared/graphql/member-operations.ts';

interface CurrentEndUserMemberShape {
	id?: string;
	community?: {
		id?: string;
	};
}

const CURRENT_END_USER_MEMBER_LOOKUP_MAX_ATTEMPTS = 20;
const CURRENT_END_USER_MEMBER_LOOKUP_DELAY_MS = 150;

export class CurrentEndUserMemberIdForCommunity extends Question<Promise<string>> {
	constructor(private readonly communityId: string) {
		super(`current end-user member id for community "${communityId}"`);
	}

	static inCommunity(communityId: string): CurrentEndUserMemberIdForCommunity {
		return new CurrentEndUserMemberIdForCommunity(communityId);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const graphql = GraphQLClient.as(actor as unknown as Actor);

		for (let attempt = 1; attempt <= CURRENT_END_USER_MEMBER_LOOKUP_MAX_ATTEMPTS; attempt++) {
			const response = await graphql.execute(MEMBERS_FOR_CURRENT_END_USER_QUERY);
			const members = (response.data?.['membersForCurrentEndUser'] as CurrentEndUserMemberShape[] | undefined) ?? [];
			const currentEndUserMember = members.find((member) => String(member.community?.id ?? '') === String(this.communityId));

			if (currentEndUserMember?.id) {
				return String(currentEndUserMember.id);
			}

			await wait(CURRENT_END_USER_MEMBER_LOOKUP_DELAY_MS);
		}

		throw new Error(`No current end-user member found for community "${this.communityId}" after waiting ${CURRENT_END_USER_MEMBER_LOOKUP_MAX_ATTEMPTS * CURRENT_END_USER_MEMBER_LOOKUP_DELAY_MS}ms`);
	}
}

function wait(delayMs: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, delayMs));
}
