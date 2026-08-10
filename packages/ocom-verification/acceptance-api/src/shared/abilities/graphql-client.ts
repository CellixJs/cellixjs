import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { getActorContext, getActorToken } from './actor-auth.ts';

export function createGraphQLClientAbility(apiUrl: string, actorName: string): GraphQLClient {
	return new GraphQLClient({
		apiUrl,
		headers: () => {
			const headers: Record<string, string> = {};
			const token = getActorToken(actorName);
			if (token !== null) {
				headers['Authorization'] = token;
			}
			const context = getActorContext(actorName);
			if (context) {
				headers['x-member-id'] = context.memberId;
				headers['x-community-id'] = context.communityId;
			}
			return headers;
		},
	});
}
