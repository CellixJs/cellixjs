import { ApolloServer } from '@apollo/server';
import type { HttpHandler } from '@azure/functions-v4';
import type { ApplicationServicesFactory, PrincipalHints } from '@ocom/api-application-services';
import {
	type AzureFunctionsMiddlewareOptions,
    startServerAndCreateHandler,
    type WithRequired
} from './azure-functions.ts';
import type { GraphContext } from './context.ts';
import { combinedSchema } from '../schema/builder/schema-builder.ts';
import { applyMiddleware } from 'graphql-middleware';
import type { GraphQLSchemaWithFragmentReplacements } from 'graphql-middleware/types';

const serverConfig = (securedSchema: GraphQLSchemaWithFragmentReplacements) => {
	return {
		schema: securedSchema,
        cors: {
            origin: true,
            credentials: true,
        },
        allowBatchedHttpRequests: true,
	};
};

export const graphHandlerCreator = (
	applicationServicesFactory: ApplicationServicesFactory,
): HttpHandler => {
	// Set up Apollo Server
    const securedSchema = applyMiddleware(combinedSchema);
	const server = new ApolloServer<GraphContext>({
        ...serverConfig(securedSchema)
	});
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
	return startServerAndCreateHandler<GraphContext>(server, functionOptions);
};