import type { GraphQLResolveInfo } from 'graphql';
import type {
	MutationStaffUserAssignRoleArgs,
	QueryStaffUserByIdArgs,
	Resolvers,
	RequireFields,
} from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

const staffUser: Resolvers = {
	StaffUserActivityDetail: {
		activityByStaffUserDisplayName: async (parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return parent.activityByStaffUserId;
			}
			const users = await context.applicationServices.User.StaffUser.list();
			const found = users.find((u) => String(u.id) === String(parent.activityByStaffUserId));
			return found?.displayName ?? parent.activityByStaffUserId;
		},
	},
	Query: {
		currentStaffUserAndCreateIfNotExists: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.User.StaffUser.createIfNotExists({
				externalId: jwt.sub,
				firstName: jwt.given_name ?? '',
				lastName: jwt.family_name ?? '',
				email: jwt.email ?? '',
				aadRoles: jwt.roles ?? [],
			});
		},

		staffUsers: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.User.StaffUser.list();
		},

		staffUserById: async (_parent, args: QueryStaffUserByIdArgs, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const users = await context.applicationServices.User.StaffUser.list();
			return users.find((u) => String(u.id) === String(args.id)) ?? null;
		},
	},
	Mutation: {
		staffUserAssignRole: async (
			_parent,
			args: RequireFields<MutationStaffUserAssignRoleArgs, 'input'>,
			context: GraphContext,
			_info: GraphQLResolveInfo,
		) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			try {
				const actorStaffUser = await context.applicationServices.User.StaffUser.queryByExternalId({ externalId: jwt.sub });
				const actorStaffUserId = actorStaffUser?.id ?? jwt.sub;
				const command = {
					staffUserId: String(args.input.staffUserId),
					roleId: String(args.input.roleId),
					actorStaffUserId,
				};
				const staffUser = await context.applicationServices.User.StaffUser.assignRole(command);
				return { status: { success: true }, staffUser };
			} catch (error) {
				console.error('StaffUser > staffUserAssignRole: ', error);
				const { message } = error as Error;
				return { status: { success: false, errorMessage: message } };
			}
		},
	},
};


export default staffUser;
