import type { GraphQLResolveInfo } from "graphql";
import type { GraphContext } from "../../init/context.ts";
import type { Resolvers } from "../builder/generated.ts";

const member: Resolvers = {
    Member: {
        community: async (parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
            return await context.applicationServices.Community.Community.queryById({
                id: parent.communityId
            });
        },
        // role: async (parent, _args: unknown, _context: GraphContext, _info: GraphQLResolveInfo) => {
        //     return await parent.loadRole();
        // },
        isAdmin: async (parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
            return await context.applicationServices.Community.Member.determineIfAdmin({
                memberId: parent.id,
            });
        }
    },
    Query: {
        membersForCurrentEndUser: async (_parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
            const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
            if (!jwt) { throw new Error('Unauthorized'); }
            const externalId = typeof jwt.sub === 'string' ? jwt.sub : undefined;
            if (!externalId) { throw new Error('Missing sub claim'); }
            return await context.applicationServices.Community.Member.queryByEndUserExternalId({
                externalId,
            });
        }
    },
};

export default member;