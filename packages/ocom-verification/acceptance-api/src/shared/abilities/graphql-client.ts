import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { getActorHints, getActorToken } from './actor-auth.ts';

export function createGraphQLClientAbility(apiUrl: string, actorName: string): GraphQLClient {
	return new GraphQLClient({
		apiUrl,
		headers: () => {
			const token = getActorToken(actorName);
			const hints = getActorHints(actorName);
			return {
				...(token === null ? {} : { Authorization: token }),
				...(hints?.memberId ? { 'x-member-id': hints.memberId } : {}),
				...(hints?.communityId ? { 'x-community-id': hints.communityId } : {}),
			};
		},
	});
}
