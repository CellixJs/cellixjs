import type { GraphQLResolveInfo } from 'graphql';
import type { GraphContext } from '../context.ts';
import type { Resolvers } from '../builder/generated.ts';

const endUserRole: Resolvers = {
	Query: {
		endUserRolesByCommunityId: async (_parent, args: { communityId: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const roles = await context.applicationServices.Community.Role.EndUserRole.queryByCommunityId({
				communityId: args.communityId,
			});
			// biome-ignore lint/suspicious/noExplicitAny: GraphQL codegen type mismatch with domain types
			return roles as any;
		},
		endUserRole: async (_parent, args: { id: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const role = await context.applicationServices.Community.Role.EndUserRole.queryById({
				id: args.id,
			});
			// biome-ignore lint/suspicious/noExplicitAny: GraphQL codegen type mismatch with domain types
			return role as any;
		},
	},
};

export default endUserRole;
