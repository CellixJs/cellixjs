import { type Actor, type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import { GraphQLClient } from '../../../shared/abilities/graphql-client.ts';
import { GET_COMMUNITY_QUERY } from '../../../shared/graphql/community-operations.ts';
import type { CommunityNotes } from '../abilities/community-types.ts';

export class CommunityName extends Question<Promise<string>> {
	constructor() {
		super('community name');
	}

	static displayed(): CommunityName {
		return new CommunityName();
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const notedTitle = await this.readNote(actor, 'lastCommunityName');
		const communityId = await this.readNote(actor, 'lastCommunityId');

		const apiName = await this.readNameFromApi(actor, communityId);
		if (apiName) {
			return apiName;
		}

		if (!notedTitle) {
			throw new Error('No community name found in the system or actor notes. Did the actor create a community first?');
		}

		return notedTitle;
	}

	override toString = () => 'community name';

	private async readNameFromApi(actor: AnswersQuestions & UsesAbilities, communityId?: string): Promise<string | undefined> {
		if (!communityId) {
			return undefined;
		}

		try {
			const graphql = GraphQLClient.as(actor as unknown as Actor);
			const response = await graphql.execute(GET_COMMUNITY_QUERY, {
				id: communityId,
			});
			const community = response.data['communityById'] as Record<string, unknown> | undefined;
			return community?.['name'] ? String(community['name']) : undefined;
		} catch {
			return undefined;
		}
	}

	private async readNote(actor: AnswersQuestions & UsesAbilities, key: keyof CommunityNotes): Promise<string | undefined> {
		try {
			return await actor.answer(notes<Record<typeof key, string>>().get(key));
		} catch {
			return undefined;
		}
	}
}
