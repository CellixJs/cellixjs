import { mergeResolvers } from '@graphql-tools/merge';
import type { Resolvers } from './generated.ts';
import { ocomGraphqlPermissions, ocomGraphqlResolvers } from './resolver-manifest.generated.ts';

function mergeResolverModules(modules: Resolvers[]): Resolvers {
	return (modules.length === 0 ? {} : mergeResolvers(modules)) as Resolvers;
}

export const resolvers: Resolvers = mergeResolverModules([...ocomGraphqlResolvers]);
export const permissions: Resolvers = mergeResolverModules(ocomGraphqlPermissions);
