import type { GraphQLResolveInfo } from 'graphql';
import type { Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

const staffUser: Resolvers = {
	Query: {
		currentStaffUserAndCreateIfNotExists: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				throw new Error('Unauthorized');
			}
			const result = await context.applicationServices.User.StaffUser.createIfNotExists({
				externalId: jwt.sub,
				firstName: jwt.given_name ?? '',
				lastName: jwt.family_name ?? '',
				email: jwt.email ?? '',
				aadRoles: jwt.roles ?? [],
			});
			return result;
		},

		staffUsers: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.User.StaffUser.list();
		},

		staffRoles: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.User.StaffRole.list();
		},

		staffUserById: async (_parent, args: { id: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const users = await context.applicationServices.User.StaffUser.list();
			return users.find((u) => String(u.id) === String(args.id)) ?? null;
		},
	},

	Mutation: {
		staffRoleCreate: async (_parent, args: { input: { roleName: string; enterpriseAppRole?: string | null; permissions?: { communityPermissions?: { canManageCommunities?: boolean | null; canManageStaffRolesAndPermissions?: boolean | null; canManageAllCommunities?: boolean | null; canDeleteCommunities?: boolean | null; canChangeCommunityOwner?: boolean | null; canReIndexSearchCollections?: boolean | null } | null; userPermissions?: { canManageUsers?: boolean | null; canAssignStaffUserRoles?: boolean | null } | null } | null } }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			try {
				const staffRole = await context.applicationServices.User.StaffRole.create({
					roleName: args.input.roleName,
					permissions: {
						community: {
							canManageCommunities: args.input.permissions?.communityPermissions?.canManageCommunities ?? false,
							canManageStaffRolesAndPermissions: args.input.permissions?.communityPermissions?.canManageStaffRolesAndPermissions ?? false,
							canManageAllCommunities: args.input.permissions?.communityPermissions?.canManageAllCommunities ?? false,
							canDeleteCommunities: args.input.permissions?.communityPermissions?.canDeleteCommunities ?? false,
							canChangeCommunityOwner: args.input.permissions?.communityPermissions?.canChangeCommunityOwner ?? false,
							canReIndexSearchCollections: args.input.permissions?.communityPermissions?.canReIndexSearchCollections ?? false,
						},
						user: {
							canManageUsers: args.input.permissions?.userPermissions?.canManageUsers ?? false,
							canAssignStaffUserRoles: args.input.permissions?.userPermissions?.canAssignStaffUserRoles ?? false,
						},
					},
				});
				return { status: { success: true }, staffRole };
			} catch (error) {
				console.error('StaffRole > staffRoleCreate: ', error);
				const { message } = error as Error;
				return { status: { success: false, errorMessage: message } };
			}
		},

		staffUserAssignRole: async (_parent, args: { input: { staffUserId: string; roleId: string } }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			try {
				const staffUser = await context.applicationServices.User.StaffUser.assignRole({
					staffUserId: String(args.input.staffUserId),
					roleId: String(args.input.roleId),
				});
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
