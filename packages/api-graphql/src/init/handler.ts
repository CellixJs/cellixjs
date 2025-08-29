import type { HttpHandler } from '@azure/functions-v4';
import type { ApplicationServicesFactory, PrincipalHints } from '@ocom/api-application-services';
import type { ApolloServerProvider } from '@ocom/service-apollo-server';
import {
	type AzureFunctionsMiddlewareOptions,
    startServerAndCreateHandler,
    type WithRequired
} from './azure-functions.ts';
import type { GraphContext } from './context.ts';

export const createGraphHandlerCreator = (apolloServerService: ApolloServerProvider<GraphContext>) => {
	return (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
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
		return startServerAndCreateHandler<GraphContext>(apolloServerService.server, functionOptions);
	};
};

// Maintain backward compatibility - this will be removed after refactoring
export const graphHandlerCreator = (
	_applicationServicesFactory: ApplicationServicesFactory,
): HttpHandler => {
	throw new Error('Direct graphHandlerCreator usage is deprecated. Apollo Server should be injected via createGraphHandlerCreator. This error indicates the refactoring is not complete.');
};