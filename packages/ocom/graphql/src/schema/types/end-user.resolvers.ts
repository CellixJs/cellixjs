import type { GraphQLResolveInfo } from "graphql";
import type { GraphContext } from "../context.ts";
import type { Resolvers } from "../builder/generated.ts";
import { getRequestedFieldPaths } from "@cellix/graphql-core/utils";

const endUser: Resolvers = {
    Query: {
        currentEndUserAndCreateIfNotExists: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
            if (!context.applicationServices.verifiedUser?.verifiedJwt) { throw new Error('Unauthorized'); }
            return await context.applicationServices.User.EndUser.createIfNotExists({
                externalId: context.applicationServices.verifiedUser.verifiedJwt?.sub,
                lastName: context.applicationServices.verifiedUser.verifiedJwt?.family_name,
                restOfName: context.applicationServices.verifiedUser.verifiedJwt?.given_name,
                email: context.applicationServices.verifiedUser.verifiedJwt?.email
            });
        },
        endUserById: async (_parent, args: { id: string }, context: GraphContext, info: GraphQLResolveInfo) => {
            return await context.applicationServices.User.EndUser.queryById({
                id: args.id,
                fields: getRequestedFieldPaths(info)
            });
        },
    },
};

export default endUser;