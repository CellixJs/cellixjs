import type { GraphQLResolveInfo } from 'graphql';
import type { Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

const member: Resolvers = {
	Member: {
		community: async (parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			return await context.applicationServices.Community.Community.queryById({
				id: parent.communityId,
			});
		},
		// role: async (parent, _args: unknown, _context: GraphContext, _info: GraphQLResolveInfo) => {
		//     return await parent.loadRole();
		// },
		isAdmin: async (parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			return await context.applicationServices.Community.Member.determineIfAdmin({
				memberId: parent.id,
			});
		},
	},
	Query: {
		membersByCommunityId: async (_parent, args: { communityId: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			return await context.applicationServices.Community.Member.queryByCommunityId({
				communityId: args.communityId,
			});
		},
		membersForCurrentEndUser: async (_parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const externalId = context.applicationServices.verifiedUser.verifiedJwt.sub;
			return await context.applicationServices.Community.Member.queryByEndUserExternalId({
				externalId,
			});
		},
	},
};

export default member;
