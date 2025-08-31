import type { BaseContext } from '@apollo/server';
import type { IResolvers } from '@graphql-tools/utils';
/**
 * Options for creating a GraphQL schema
 */
export interface CellixSchemaOptions<TContext extends BaseContext = BaseContext> {
    /** Application resolvers to merge with scalar resolvers */
    resolvers: IResolvers<unknown, TContext> | Array<IResolvers<unknown, TContext>>;
    /** Custom GraphQL type definitions (optional - will be merged with scalars) */
    customTypeDefs?: string | string[];
    /** Path to load GraphQL schema files from (defaults to application schema directory) */
    schemaFilesPath?: string;
}
/**
 * Creates a complete executable GraphQL schema with Cellix conventions
 * @param options Schema creation options
 * @returns Executable GraphQL schema
 */
export declare function createCellixSchema<TContext extends BaseContext = BaseContext>(options: CellixSchemaOptions<TContext>): import("graphql").GraphQLSchema;
/**
 * Convenience function for creating a schema with common Cellix patterns
 * @param resolvers Application resolvers
 * @param schemaFilesPath Optional path to schema files
 * @returns Executable GraphQL schema
 */
export declare function createCellixSchemaSimple<TContext extends BaseContext = BaseContext>(resolvers: IResolvers<unknown, TContext> | Array<IResolvers<unknown, TContext>>, schemaFilesPath?: string): import("graphql").GraphQLSchema;
