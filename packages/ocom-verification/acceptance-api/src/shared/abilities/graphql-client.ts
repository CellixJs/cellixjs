import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';

export function createGraphQLClientAbility(apiUrl: string): GraphQLClient {
	return new GraphQLClient({
		apiUrl,
		headers: {
			Authorization: 'Bearer test-token',
		},
	});
}
