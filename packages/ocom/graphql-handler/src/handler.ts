import type { HttpHandler } from '@azure/functions';
import type { ApplicationServicesFactory, PrincipalHints } from '@ocom/application-services';
import type { ServiceApolloServer } from '@ocom/service-apollo-server';
import type { GraphContext } from '@ocom/graphql';
import {
	type AzureFunctionsMiddlewareOptions,
	createHandler,
	type WithRequired
} from './azure-functions.ts';

/**
 * Creates a GraphQL HTTP handler for Azure Functions.
 * 
 * @param apolloServerService - The Apollo Server service instance
 * @param applicationServicesFactory - Factory for creating request-scoped application services
 * @returns An Azure Functions HTTP handler
 */
export const graphHandlerCreator = (
	apolloServerService: ServiceApolloServer<GraphContext>,
	applicationServicesFactory: ApplicationServicesFactory,
): HttpHandler => {
	const functionOptions: WithRequired<AzureFunctionsMiddlewareOptions<GraphContext>, 'context'> = {
		context: async ({ req }) => {
			const authHeader = req.headers.get('Authorization') ?? undefined;
			const hints: PrincipalHints = {
				memberId: req.headers.get('x-member-id') ?? undefined,
				communityId: req.headers.get('x-community-id') ?? undefined,
			};
			return Promise.resolve({
				applicationServices: await applicationServicesFactory.forRequest(authHeader, hints),
			});
		},
	};
	return createHandler<GraphContext>(apolloServerService.server, functionOptions);
};
