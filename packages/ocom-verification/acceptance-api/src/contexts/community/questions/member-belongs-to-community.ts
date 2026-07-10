import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import { MEMBERS_BY_COMMUNITY_QUERY } from '../../../shared/graphql/member-operations.ts';
import type { MemberNotes } from '../notes/member-notes.ts';

interface MemberQueryShape {
	id?: string;
	memberName?: string;
}

export class MemberBelongsToCommunity extends Question<Promise<boolean>> {
	constructor(
		private readonly expectedMemberName: string,
		private readonly communityId: string,
	) {
		super(`whether member "${expectedMemberName}" belongs to community "${communityId}"`);
	}

	static inCommunity(expectedMemberName: string, communityId: string): MemberBelongsToCommunity {
		return new MemberBelongsToCommunity(expectedMemberName, communityId);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<boolean> {
		const existsInApi = await this.readFromApi(actor);
		if (existsInApi !== undefined) {
			return existsInApi;
		}

		const notedMemberName = await this.readNote(actor, 'lastMemberName');
		const notedCommunityId = await this.readNote(actor, 'lastMemberCommunityId');
		return notedMemberName === this.expectedMemberName && notedCommunityId === this.communityId;
	}

	private async readFromApi(actor: AnswersQuestions & UsesAbilities): Promise<boolean | undefined> {
		if (!this.communityId) {
			return undefined;
		}

		try {
			const graphql = GraphQLClient.as(actor as unknown as Actor);
			const response = await graphql.execute(MEMBERS_BY_COMMUNITY_QUERY, {
				communityId: this.communityId,
			});
			const members = (response.data?.['membersByCommunityId'] as MemberQueryShape[] | undefined) ?? [];
			return members.some((member) => String(member.memberName ?? '') === this.expectedMemberName);
		} catch {
			return undefined;
		}
	}

	private async readNote(actor: AnswersQuestions & UsesAbilities, key: keyof MemberNotes): Promise<string | undefined> {
		try {
			return await actor.answer(notes<Record<typeof key, string>>().get(key));
		} catch {
			return undefined;
		}
	}
}
