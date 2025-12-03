import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { IResolvers } from '@graphql-tools/utils';
import { typeDefs as scalarTypeDefs, resolvers as scalarResolvers } from 'graphql-scalars';
import type { GraphQLSchema } from 'graphql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load base Cellix GraphQL schema files
 */
function loadBaseCellixTypeDefs() {
  const baseSchemaGlob = path.resolve(__dirname, '../../src/schema/**/*.graphql');
  return loadFilesSync(baseSchemaGlob);
}

/**
 * Create a complete GraphQL schema by combining base Cellix types with additional types
 * @param additionalTypeDefs - Additional GraphQL type definitions to include
 * @param additionalResolvers - Additional resolvers to include
 * @returns A complete executable GraphQL schema
 */
export function buildCellixSchema<TContext = Record<string, unknown>>(
  additionalTypeDefs: string | string[] = [],
  additionalResolvers: IResolvers<unknown, TContext>[] = [],
): GraphQLSchema {
  // Load base Cellix schema files
  const baseTypeDefs = loadBaseCellixTypeDefs();

  // Normalize additional typeDefs to array
  const additionalTypeDefsArray = Array.isArray(additionalTypeDefs) ? additionalTypeDefs : [additionalTypeDefs];

  // Merge all type definitions
  const allTypeDefs = mergeTypeDefs([
    ...scalarTypeDefs, // GraphQL scalars
    ...baseTypeDefs, // Base Cellix types (Query, Mutation, MongoBase, etc.)
    ...additionalTypeDefsArray, // Additional types from consumer
  ]);

  // Merge all resolvers
  const allResolvers = mergeResolvers([
    scalarResolvers, // GraphQL scalar resolvers
    ...additionalResolvers, // Additional resolvers from consumer
  ]);

  // Create executable schema
  return makeExecutableSchema<TContext>({
    typeDefs: allTypeDefs,
    resolvers: allResolvers,
  });
}

/**
 * Load resolvers from a glob pattern
 * @param globPattern - Glob pattern to match resolver files
 * @returns Merged resolvers
 */
export function loadResolversFromGlob(globPattern: string): IResolvers {
  const resolverFiles = loadFilesSync(globPattern);
  return mergeResolvers(resolverFiles);
}