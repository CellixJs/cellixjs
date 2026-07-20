import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { getActorToken } from './actor-auth.ts';

export function createGraphQLClientAbility(apiUrl: string, actorName: string): GraphQLClient {
	return new GraphQLClient({
		apiUrl,
		headers: () => {
			const token = getActorToken(actorName);
			return token === null ? {} : { Authorization: token };
		},
	});
}
