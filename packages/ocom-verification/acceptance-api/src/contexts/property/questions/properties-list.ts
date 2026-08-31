import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import { PROPERTIES_BY_COMMUNITY_ID_QUERY, type PropertyResult } from '../../../shared/graphql/property-operations.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';

/**
 * Question that reads the non-deleted properties of a community from the API.
 * Defaults to the actor's active community recorded in notes.
 */
export class PropertiesList extends Question<Promise<PropertyResult[]>> {
	static displayed(): PropertiesList {
		return new PropertiesList(undefined);
	}

	static ofCommunity(communityId: string): PropertiesList {
		return new PropertiesList(communityId);
	}

	private constructor(private readonly communityId: string | undefined) {
		super('the properties list');
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<PropertyResult[]> {
		const communityId = this.communityId ?? (await this.readActiveCommunityId(actor));
		if (!communityId) {
			throw new Error('No community id available to list properties. Did the actor become a property manager or member of a community first?');
		}
		const response = await GraphQLClient.as(actor as unknown as Actor).execute(PROPERTIES_BY_COMMUNITY_ID_QUERY, { communityId });
		return response.data['propertiesByCommunityId'] as PropertyResult[];
	}

	override toString = () => 'the properties list';

	private async readActiveCommunityId(actor: AnswersQuestions & UsesAbilities): Promise<string | undefined> {
		try {
			return await actor.answer(notes<PropertyNotes>().get('activeCommunityId'));
		} catch {
			return undefined;
		}
	}
}
