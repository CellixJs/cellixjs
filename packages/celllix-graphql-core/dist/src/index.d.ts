/**
 * @celllix/graphql-core
 *
 * Core GraphQL utilities and schema building components for Cellix applications.
 * Provides reusable GraphQL schema building, resolver loading, and common GraphQL types.
 */
export { createCellixSchema, createCellixSchemaSimple, type CellixSchemaOptions } from './schema-builder.js';
export { createResolverBuilders } from './resolver-builder.js';
export * as GraphQLScalars from 'graphql-scalars';
export { loadFilesSync } from '@graphql-tools/load-files';
export { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge';
export { makeExecutableSchema } from '@graphql-tools/schema';
export type { BaseContext } from '@apollo/server';
export type { IResolvers } from '@graphql-tools/utils';
