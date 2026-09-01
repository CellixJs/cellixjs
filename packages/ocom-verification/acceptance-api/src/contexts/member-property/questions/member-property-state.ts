import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import { PROPERTIES_BY_COMMUNITY_ID_QUERY, type PropertyResult } from '../../../shared/graphql/property-operations.ts';
import type { MemberPropertyNotes } from '../notes/member-property-notes.ts';

export const MemberPropertyOperationStatus = () => Question.about('the member Property operation status', async (actor) => await actor.answer(notes<MemberPropertyNotes>().get('lastOperationStatus')));

export const MemberPropertyOperationError = () => Question.about('the member Property operation error', async (actor) => await actor.answer(notes<MemberPropertyNotes>().get('lastOperationError')));

export const MemberPropertyDirectoryStatus = () => Question.about('the member Property directory status', async (actor) => await actor.answer(notes<MemberPropertyNotes>().get('directoryStatus')));

export const MemberPropertyDirectoryNames = () => Question.about('the member Property directory names', async (actor) => await actor.answer(notes<MemberPropertyNotes>().get('listedPropertyNames')));

export const MemberPropertyReadStatus = () => Question.about('the member Property read status', async (actor) => await actor.answer(notes<MemberPropertyNotes>().get('lastReadStatus')));

export const MemberPropertyReadError = () => Question.about('the member Property read error', async (actor) => await actor.answer(notes<MemberPropertyNotes>().get('lastReadError')));

/** Reads a property by name from the actor's active member Property community. */
export class MemberPropertyNamed extends Question<Promise<PropertyResult | undefined>> {
	static called(propertyName: string): MemberPropertyNamed {
		return new MemberPropertyNamed(propertyName);
	}

	private constructor(private readonly propertyName: string) {
		super(`the member Property named "${propertyName}"`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<PropertyResult | undefined> {
		const communityId = await actor.answer(notes<MemberPropertyNotes>().get('activeCommunityId'));
		if (!communityId) {
			throw new Error('No active member Property community is available to query a property by name');
		}
		const response = await GraphQLClient.as(actor as unknown as Actor).execute(PROPERTIES_BY_COMMUNITY_ID_QUERY, { communityId });
		const properties = response.data.propertiesByCommunityId as PropertyResult[];
		return properties.find((property) => property.propertyName === this.propertyName);
	}
}
