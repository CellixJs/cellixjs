import type { ServiceApolloServerOptions } from '@ocom/service-apollo-server';
import { applyMiddleware } from 'graphql-middleware';
import { combinedSchema } from '@ocom/api-graphql';

// Apply middleware to the combined schema
const securedSchema = applyMiddleware(combinedSchema);

export const apolloServerOptions: ServiceApolloServerOptions = {
	schema: securedSchema,
	cors: {
		origin: true,
		credentials: true,
	},
	allowBatchedHttpRequests: true,
};