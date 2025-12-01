import type { GraphQLResolveInfo } from "graphql";
import type { GraphContext } from "../../init/context.ts";
import type { Resolvers } from "../builder/generated.ts";
import { getRequestedFieldPaths } from "../resolver-helper.ts";

// Helper to safely extract string property from JWT payload
function getStringProperty(obj: Record<string, unknown> | undefined, key: string): string | undefined {
    const value = obj?.[key];
    return typeof value === 'string' ? value : undefined;
}

const endUser: Resolvers = {
    Query: {
        currentEndUserAndCreateIfNotExists: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
            const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
            if (!jwt) { throw new Error('Unauthorized'); }
            
            const externalId = getStringProperty(jwt, 'sub');
            const lastName = getStringProperty(jwt, 'family_name');
            const restOfName = getStringProperty(jwt, 'given_name');
            const email = getStringProperty(jwt, 'email');
            
            if (!externalId || !email) {
                throw new Error('Required JWT claims missing');
            }
            
            return await context.applicationServices.User.EndUser.createIfNotExists({
                externalId,
                lastName,
                restOfName,
                email
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