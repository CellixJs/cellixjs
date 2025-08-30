import type { HttpHandler } from '@azure/functions-v4';
import type { ApplicationServicesFactory, PrincipalHints } from '@ocom/api-application-services';
import {
	type AzureFunctionsMiddlewareOptions,
    startServerAndCreateHandler,
    type WithRequired
} from './azure-functions.ts';
import type { GraphContext } from './context.ts';

export const graphHandlerCreator = (
	applicationServicesFactory: ApplicationServicesFactory<GraphContext>,
): HttpHandler => {
	// Get the Apollo Server service from the infrastructure context
	const infrastructureContext = applicationServicesFactory.getInfrastructureContext();
	const apolloServerService = infrastructureContext.apolloServerService;
	
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