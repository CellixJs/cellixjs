import type { Domain } from '@ocom/domain';
import type { GraphQLResolveInfo } from 'graphql';
import type { GraphContext } from '../context.ts';
import type {
	MemberCreateInput,
	MemberUpdateInput,
	Resolvers,
} from '../builder/generated.ts';

const MemberMutationResolver = async (
	getMember: Promise<Domain.Contexts.Community.Member.MemberEntityReference>,
) => {
	try {
		return {
			status: { success: true },
			member: await getMember,
		};
	} catch (error) {
		console.error('Member > Mutation  : ', error);
		const { message } = error as Error;
		return {
			status: { success: false, errorMessage: message },
		};
	}
};

const member: Resolvers = {
	Member: {
		community: async (
			parent,
			_args: unknown,
			context: GraphContext,
			_info: GraphQLResolveInfo,
		) => {
			return await context.applicationServices.Community.Community.queryById({
				id: parent.communityId,
			});
		},
		// role: async (parent, _args: unknown, _context: GraphContext, _info: GraphQLResolveInfo) => {
		//     return await parent.loadRole();
		// },
		isAdmin: async (
			parent,
			_args: unknown,
			context: GraphContext,
			_info: GraphQLResolveInfo,
		) => {
			return await context.applicationServices.Community.Member.determineIfAdmin(
				{
					memberId: parent.id,
				},
			);
		},
	},
	Query: {
		membersForCurrentEndUser: async (
			_parent,
			_args: unknown,
			context: GraphContext,
			_info: GraphQLResolveInfo,
		) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const externalId = context.applicationServices.verifiedUser.verifiedJwt.sub;
			return await context.applicationServices.Community.Member.queryByEndUserExternalId(
				{
					externalId,
				},
			);
		},
		membersByCommunityId: async (
			_parent,
			args: { communityId: string },
			context: GraphContext,
			_info: GraphQLResolveInfo,
		) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Community.Member.queryByCommunityId(
				{
					communityId: args.communityId,
				},
			);
		},
		member: async (
			_parent,
			args: { id: string },
			context: GraphContext,
			_info: GraphQLResolveInfo,
		) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Community.Member.queryById({
				id: args.id,
			});
		},
	},
	Mutation: {
		memberCreate: async (
			_parent,
			args: { input: MemberCreateInput },
			context: GraphContext,
		) => {
			if (!context.applicationServices?.verifiedUser?.verifiedJwt?.sub) {
				throw new Error('Unauthorized');
			}
			// Get the current community from hints if not provided
			const communityId =
				context.applicationServices.verifiedUser?.hints?.communityId;
			if (!communityId) {
				throw new Error('Community ID is required');
			}

			return await MemberMutationResolver(
				context.applicationServices.Community.Member.create({
					memberName: args.input.memberName,
					communityId,
				}),
			);
		},
		memberUpdate: async (
			_parent,
			args: { input: MemberUpdateInput },
			context: GraphContext,
		) => {
			if (!context.applicationServices?.verifiedUser?.verifiedJwt?.sub) {
				throw new Error('Unauthorized');
			}

			const updateCommand: {
				id: string;
				memberName?: string;
			} = {
				id: args.input.id,
			};

			if (args.input.memberName !== undefined && args.input.memberName !== null) {
				updateCommand.memberName = args.input.memberName;
			}

			return await MemberMutationResolver(
				context.applicationServices.Community.Member.update(updateCommand),
			);
		},
		memberProfileUpdate: async (
			_parent,
			args: { input: { memberId: string; profile: unknown } },
			context: GraphContext,
		) => {
			if (!context.applicationServices?.verifiedUser?.verifiedJwt?.sub) {
				throw new Error('Unauthorized');
			}

			// TODO: Implement profile update in domain and application service
			// For now, return success to allow UI testing
			return {
				status: { success: true },
				member: await context.applicationServices.Community.Member.queryById({
					id: args.input.memberId,
				}),
			};
		},
	},
};

export default member;