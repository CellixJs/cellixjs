import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { IResolvers } from '@graphql-tools/utils';
import { typeDefs as scalarTypeDefs, resolvers as scalarResolvers } from 'graphql-scalars';
import type { GraphQLSchema, DocumentNode } from 'graphql';
import { baseCellixTypeDefs } from '@cellix/graphql-core';

/**
 * Create a complete GraphQL schema by combining base Cellix types with additional types
 * @param additionalTypeDefs - Additional GraphQL type definitions to include
 * @param additionalResolvers - Additional resolvers to include
 * @returns A complete executable GraphQL schema
 */
export function buildCellixSchema<TContext = Record<string, unknown>>(
	additionalTypeDefs: (string | DocumentNode) | Array<string | DocumentNode> = [],
	additionalResolvers: IResolvers<unknown, TContext>[] = [],
): GraphQLSchema {
	const additionalTypeDefsArray = Array.isArray(additionalTypeDefs)
		? additionalTypeDefs
		: [additionalTypeDefs];

	const allTypeDefs = mergeTypeDefs([
		...scalarTypeDefs, // GraphQL scalars
		...baseCellixTypeDefs, // Base Cellix types (Query, Mutation, MongoBase, etc.)
		...additionalTypeDefsArray,
	]);

	const allResolvers = mergeResolvers([
		scalarResolvers, // GraphQL scalar resolvers
		...additionalResolvers,
	]);

	return makeExecutableSchema<TContext>({
		typeDefs: allTypeDefs,
		resolvers: allResolvers,
	});
}
