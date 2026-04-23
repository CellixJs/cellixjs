import { type Actor, type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { GraphQLClient } from '../shared/abilities/graphql-client.ts';

export interface CommunityNotes {
	lastCommunityStatus: string;
	lastCommunityName: string;
	lastCommunityId: string;
	lastValidationError: string;
}

const GET_COMMUNITY_QUERY = `
	query CommunityById($id: ObjectID!) {
		communityById(id: $id) { id name }
	}
`;

async function readCommunityNote(actor: AnswersQuestions & UsesAbilities, key: keyof CommunityNotes): Promise<string | undefined> {
	try {
		return await actor.answer(notes<Record<typeof key, string>>().get(key));
	} catch {
		return undefined;
	}
}

export class CommunityStatus extends Question<Promise<string>> {
	constructor() {
		super('community status');
	}

	static of(): CommunityStatus {
		return new CommunityStatus();
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const notedStatus = await readCommunityNote(actor, 'lastCommunityStatus');
		if (!notedStatus) {
			throw new Error('No community status found in actor notes. Did the actor create a community first?');
		}
		return notedStatus;
	}

	override toString(): string {
		return 'the community status';
	}
}

export class CommunityName extends Question<Promise<string>> {
	constructor() {
		super('community name');
	}

	static displayed(): CommunityName {
		return new CommunityName();
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const notedTitle = await readCommunityNote(actor, 'lastCommunityName');
		const communityId = await readCommunityNote(actor, 'lastCommunityId');

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
			const community = response.data.communityById as Record<string, unknown> | undefined;
			return community?.name ? String(community.name) : undefined;
		} catch {
			return undefined;
		}
	}
}
