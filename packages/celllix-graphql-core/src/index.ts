/**
 * @celllix/graphql-core
 * 
 * Core GraphQL utilities and schema building components for Cellix applications.
 * Provides reusable GraphQL schema building, resolver loading, and common GraphQL types.
 */

// Schema building utilities
export { 
  createCellixSchema, 
  createCellixSchemaSimple,
  type CellixSchemaOptions 
} from './schema-builder.js';

// Resolver building utilities
export { createResolverBuilders } from './resolver-builder.js';

// Core GraphQL scalars and tools re-exports
export * as GraphQLScalars from 'graphql-scalars';

// Re-export commonly used GraphQL Tools utilities
export { loadFilesSync } from '@graphql-tools/load-files';
export { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge';
export { makeExecutableSchema } from '@graphql-tools/schema';

// Common types that applications might use
export type { BaseContext } from '@apollo/server';
export type { IResolvers } from '@graphql-tools/utils';