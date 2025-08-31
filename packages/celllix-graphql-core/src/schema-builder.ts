/**
 * Generic schema builder utility for GraphQL applications using Cellix.
 * Provides reusable schema building functionality with GraphQL Scalars support.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { makeExecutableSchema, type ExecutableSchemaTransformation } from '@graphql-tools/schema';
import * as Scalars from 'graphql-scalars';
import type { BaseContext } from '@apollo/server';
import type { IResolvers } from '@graphql-tools/utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Options for creating a GraphQL schema
 */
export interface CellixSchemaOptions<TContext extends BaseContext = BaseContext> {
  /** Application resolvers to merge with scalar resolvers */
  resolvers: IResolvers<any, TContext> | Array<IResolvers<any, TContext>>;
  /** Custom GraphQL type definitions (optional - will be merged with scalars) */
  customTypeDefs?: string | string[];
  /** Path to load GraphQL schema files from (defaults to application schema directory) */
  schemaFilesPath?: string;
  /** Schema transformations to apply */
  schemaTransforms?: ExecutableSchemaTransformation<TContext>[];
}

/**
 * Creates a complete executable GraphQL schema with Cellix conventions
 * @param options Schema creation options
 * @returns Executable GraphQL schema
 */
export function createCellixSchema<TContext extends BaseContext = BaseContext>(
  options: CellixSchemaOptions<TContext>
) {
  const {
    resolvers,
    customTypeDefs = [],
    schemaFilesPath,
    schemaTransforms,
  } = options;

  // Default schema files path - look for GraphQL files in the application's schema directory
  const defaultSchemaPath = schemaFilesPath || 
    path.resolve(__dirname, '../../../src/schema/**/*.graphql');
  
  let sdlFiles: string[] = [];
  try {
    sdlFiles = loadFilesSync(defaultSchemaPath);
  } catch (error) {
    // If no schema files found, continue with just custom typeDefs and scalars
    console.warn(`No GraphQL schema files found at ${defaultSchemaPath}`);
  }

  // Ensure customTypeDefs is an array
  const customTypeDefsArray = Array.isArray(customTypeDefs) ? customTypeDefs : [customTypeDefs];

  // IMPORTANT: include scalar typeDefs so SDL references like DateTime/ObjectID are defined
  const typeDefs = mergeTypeDefs([
    ...Scalars.typeDefs, // provides: scalar DateTime, scalar ObjectID, etc.
    ...sdlFiles,
    ...customTypeDefsArray.filter(Boolean),
  ]);

  // Ensure resolvers is an array and include scalar resolvers
  const resolversArray = Array.isArray(resolvers) ? resolvers : [resolvers];
  const allResolvers = [Scalars.resolvers, ...resolversArray];

  return makeExecutableSchema<TContext>({
    typeDefs,
    resolvers: allResolvers,
    schemaTransforms,
  });
}

/**
 * Convenience function for creating a schema with common Cellix patterns
 * @param resolvers Application resolvers
 * @param schemaFilesPath Optional path to schema files  
 * @returns Executable GraphQL schema
 */
export function createCellixSchemaSimple<TContext extends BaseContext = BaseContext>(
  resolvers: IResolvers<any, TContext> | Array<IResolvers<any, TContext>>,
  schemaFilesPath?: string
) {
  return createCellixSchema<TContext>({
    resolvers,
    schemaFilesPath,
  });
}