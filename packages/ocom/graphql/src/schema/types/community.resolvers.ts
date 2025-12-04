import type { Domain } from "@ocom/domain";
import type { GraphQLResolveInfo } from "graphql";
import type { GraphContext } from "../context.ts";
import type { CommunityCreateInput, Resolvers } from "../builder/generated.ts";

const CommunityMutationResolver = async (getCommunity: Promise<Domain.Contexts.Community.Community.CommunityEntityReference>) => {
  try {
    return {
      status: { success: true },
      community: await getCommunity,
    };
  } catch (error) {
    console.error('Community > Mutation  : ', error);
    const { message } = error as Error;
    return {
      status: { success: false, errorMessage: message },
    };
  }
};

const community: Resolvers = {
    Query: {
        currentCommunity: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
            if (!context.applicationServices.verifiedUser?.hints?.communityId) { throw new Error('Unauthorized'); }
            return await context.applicationServices.Community.Community.queryById({
                id: context.applicationServices.verifiedUser.hints.communityId
            });
        },
        communityById: async (_parent, args: { id: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
            return await context.applicationServices.Community.Community.queryById({
                id: args.id
            });
        },
        communitiesForCurrentEndUser: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
            if (!context.applicationServices.verifiedUser?.verifiedJwt) { throw new Error('Unauthorized'); }
            return await context.applicationServices.Community.Community.queryByEndUserExternalId({
                externalId: context.applicationServices.verifiedUser.verifiedJwt.sub
            });
        }
    },
    Mutation: {
        communityCreate: async (_parent, args: { input: CommunityCreateInput }, context: GraphContext) => {
            if (!context.applicationServices?.verifiedUser?.verifiedJwt?.sub) { throw new Error('Unauthorized'); }
            return await CommunityMutationResolver(
                context.applicationServices.Community.Community.create({
                    name: args.input.name,
                    endUserExternalId: context.applicationServices.verifiedUser?.verifiedJwt.sub
                })
            );
        }
    }
};

export default community;