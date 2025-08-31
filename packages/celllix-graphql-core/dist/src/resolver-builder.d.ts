/**
 * Creates resolver and permission builders for the application
 * @param applicationRootPath - Path to the application's schema root directory (defaults to current package root)
 */
export declare function createResolverBuilders(applicationRootPath?: string): {
    resolvers: import("@graphql-tools/utils").IResolvers<unknown, unknown>;
    permissions: import("@graphql-tools/utils").IResolvers<unknown, unknown>;
};
