import type { ServiceApolloServerOptions } from '@ocom/service-apollo-server';
import { combinedSchema, permissions } from '@ocom/graphql';

const { NODE_ENV } = process.env;
const isDev = NODE_ENV !== 'production';

/**
 * Apollo Server configuration for the API.
 * 
 * Configures:
 * - GraphQL schema with permissions middleware
 * - Introspection (enabled in development)
 * - Batched HTTP requests
 * - Maximum query depth limit
 */
export const apolloServerOptions: ServiceApolloServerOptions = {
	schema: combinedSchema,
	middleware: permissions,
	introspection: isDev,
	allowBatchedHttpRequests: true,
	maxDepth: 10,
};
