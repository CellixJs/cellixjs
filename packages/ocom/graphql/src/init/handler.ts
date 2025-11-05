import { ApolloServer } from '@apollo/server';
import depthLimit from 'graphql-depth-limit';
import type { HttpHandler } from '@azure/functions';
import type { ApplicationServicesFactory, PrincipalHints } from '@ocom/application-services';
import { applyMiddleware } from 'graphql-middleware';
import { permissions } from '../schema/builder/resolver-builder.ts';
import { combinedSchema } from '../schema/builder/schema-builder.ts';
import {
    type AzureFunctionsMiddlewareOptions,
    startServerAndCreateHandler,
    type WithRequired
} from './azure-functions.ts';
import type { GraphContext } from './context.ts';

const { NODE_ENV } = process.env;
const isDev = NODE_ENV !== 'production';

export const graphHandlerCreator = (
	applicationServicesFactory: ApplicationServicesFactory,
): HttpHandler => {
	// Set up Apollo Server
    const securedSchema = applyMiddleware(combinedSchema, permissions);
	const server = new ApolloServer<GraphContext>({
            schema: securedSchema,
            introspection: isDev,
            allowBatchedHttpRequests: true,
            validationRules: [depthLimit(10)],
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