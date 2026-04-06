import type { GraphQLResolveInfo } from 'graphql';
import type { Domain } from '@ocom/domain';
import type { GraphContext } from '../context.ts';
import type { MemberAddInput, MemberRemoveInput, MemberRoleUpdateInput, Resolvers } from '../builder/generated.ts';

const MemberMutationResolver = async (getMember: Promise<Domain.Contexts.Community.Member.MemberEntityReference>) => {
	try {
		return {
			status: { success: true },
			member: await getMember,
		};
	} catch (error) {
		console.error('Member > Mutation: ', error);
		const { message } = error as Error;
		return {
			status: { success: false, errorMessage: message },
		};
	}
};

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
		membersForCurrentEndUser: async (_parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const externalId = context.applicationServices.verifiedUser.verifiedJwt.sub;
			return await context.applicationServices.Community.Member.queryByEndUserExternalId({
				externalId,
			});
		},
		membersByCommunityId: async (_parent, args: { communityId: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Community.Member.queryByCommunityId({
				communityId: args.communityId,
			});
		},
	},
	Mutation: {
		memberAdd: (_parent, args: { input: MemberAddInput }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return MemberMutationResolver(Promise.reject(new Error('Unauthorized')));
			}
			const createdByExternalId = context.applicationServices.verifiedUser.verifiedJwt.sub;
			return MemberMutationResolver(
				context.applicationServices.Community.Member.addMember({
					communityId: args.input.communityId,
					memberName: args.input.memberName,
					firstName: args.input.firstName,
					...(args.input.lastName ? { lastName: args.input.lastName } : {}),
					userExternalId: args.input.userExternalId,
					createdByExternalId,
				}),
			);
		},
		memberRemove: (_parent, args: { input: MemberRemoveInput }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return MemberMutationResolver(Promise.reject(new Error('Unauthorized')));
			}
			return MemberMutationResolver(
				context.applicationServices.Community.Member.removeMember({
					memberId: args.input.memberId,
				}),
			);
		},
		memberRoleUpdate: (_parent, args: { input: MemberRoleUpdateInput }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return MemberMutationResolver(Promise.reject(new Error('Unauthorized')));
			}
			return MemberMutationResolver(
				context.applicationServices.Community.Member.updateMemberRole({
					memberId: args.input.memberId,
					roleId: args.input.roleId,
				}),
			);
		},
	},
};

export default member;
