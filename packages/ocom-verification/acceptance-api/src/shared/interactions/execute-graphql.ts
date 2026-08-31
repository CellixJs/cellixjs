import { GraphQLClient, type GraphQLExecuteOptions, type GraphQLResponse } from '@cellix/serenity-framework/clients/graphql';
import { Interaction, TakeNotes } from '@serenity-js/core';

export interface GraphQLResponseNotes {
	lastGraphQLResponse: GraphQLResponse;
}

/** Executes a GraphQL operation and records its response for the current actor. */
export const ExecuteGraphQL = {
	operation: (query: string, variables?: Record<string, unknown>, options?: GraphQLExecuteOptions) =>
		Interaction.where('#actor executes a GraphQL operation', async (actor) => {
			const response = await GraphQLClient.as(actor).execute(query, variables, options);
			TakeNotes.as(actor).notepad.set('lastGraphQLResponse', response);
		}),
} as const;
