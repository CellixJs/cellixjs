import type { GraphQLResolveInfo } from 'graphql';
import type { GraphContext } from '../context.ts';
import type { MemberCreateInput, MemberUpdateInput, MemberAccountAddInput, MemberAccountEditInput, MemberAccountRemoveInput, Resolvers } from '../builder/generated.ts';

const MemberMutationResolver = async (getMember: Promise<import('@ocom/domain').Domain.Contexts.Community.Member.MemberEntityReference>) => {
	try {
		return {
			status: { success: true },
			member: await getMember,
		};
	} catch (error) {
		console.error('Member > Mutation:', error);
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
		isAdmin: async (parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			return await context.applicationServices.Community.Member.determineIfAdmin({
				memberId: parent.id,
			});
		},
	},
	Query: {
		member: async (_parent, args: { id: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Community.Member.getById({ id: args.id });
		},
		membersForCurrentEndUser: async (_parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const externalId = context.applicationServices.verifiedUser.verifiedJwt.sub;
			return await context.applicationServices.Community.Member.queryByEndUserExternalId({ externalId });
		},
		membersByCommunityId: async (_parent, args: { communityId: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Community.Member.listByCommunityId({ communityId: args.communityId });
		},
	},
	Mutation: {
		memberCreate: async (_parent, args: { input: MemberCreateInput }, context: GraphContext) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await MemberMutationResolver(
				context.applicationServices.Community.Member.create({
					memberName: args.input.memberName,
					communityId: args.input.communityId,
				}),
			);
		},
		memberUpdate: async (_parent, args: { input: MemberUpdateInput }, context: GraphContext) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const memberName = args.input.memberName !== null && args.input.memberName !== undefined ? args.input.memberName : undefined;
			return await MemberMutationResolver(
				context.applicationServices.Community.Member.update({
					id: args.input.id,
					...(memberName !== undefined ? { memberName } : {}),
				}),
			);
		},
		memberAccountAdd: async (_parent, args: { input: MemberAccountAddInput }, context: GraphContext) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await MemberMutationResolver(
				context.applicationServices.Community.Member.addAccount({
					memberId: args.input.memberId,
					userId: args.input.userId,
					firstName: args.input.firstName,
					lastName: args.input.lastName ?? '',
				}),
			);
		},
		memberAccountEdit: async (_parent, args: { input: MemberAccountEditInput }, context: GraphContext) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const firstName = args.input.firstName !== null && args.input.firstName !== undefined ? args.input.firstName : undefined;
			const lastName = args.input.lastName !== null && args.input.lastName !== undefined ? args.input.lastName : undefined;
			const statusCode = args.input.statusCode !== null && args.input.statusCode !== undefined ? args.input.statusCode : undefined;
			return await MemberMutationResolver(
				context.applicationServices.Community.Member.editAccount({
					memberId: args.input.memberId,
					accountId: args.input.accountId,
					...(firstName !== undefined ? { firstName } : {}),
					...(lastName !== undefined ? { lastName } : {}),
					...(statusCode !== undefined ? { statusCode } : {}),
				}),
			);
		},
		memberAccountRemove: async (_parent, args: { input: MemberAccountRemoveInput }, context: GraphContext) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await MemberMutationResolver(
				context.applicationServices.Community.Member.removeAccount({
					memberId: args.input.memberId,
					accountId: args.input.accountId,
				}),
			);
		},
	},
};

export default member;
