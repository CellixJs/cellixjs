import { notes, Question } from '@serenity-js/core';
import type { GraphQLResponseNotes } from '../interactions/execute-graphql.ts';

/** Reads a field from the GraphQL response most recently recorded for the actor. */
export const LastGraphQLResponse = {
	field: <TValue = unknown>(path: string) =>
		Question.about<TValue>(`the "${path}" field of the last GraphQL response`, async (actor) => {
			const response = await actor.answer(notes<GraphQLResponseNotes>().get('lastGraphQLResponse'));
			return getByPath(response.data, path) as TValue;
		}),
} as const;

function getByPath(value: unknown, path: string): unknown {
	return path.split('.').reduce<unknown>((current, segment) => {
		if (!current || typeof current !== 'object') {
			return undefined;
		}

		return (current as Record<string, unknown>)[segment];
	}, value);
}
