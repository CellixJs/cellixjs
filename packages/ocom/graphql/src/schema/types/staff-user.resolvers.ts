import type { GraphQLResolveInfo } from 'graphql';
import type { Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

const EnterpriseAppRoleNames = {
	CaseManager: 'Staff.CaseManager',
	ServiceLineOwner: 'Staff.ServiceLineOwner',
	Finance: 'Staff.Finance',
	TechAdmin: 'Staff.TechAdmin',
} as const;

/** Returns the enterprise app role types a caller is allowed to target, based on their Entra roles. */
function getAllowedEnterpriseAppRoles(entraRoles: string[]): string[] {
	if (entraRoles.includes(EnterpriseAppRoleNames.TechAdmin)) {
		return Object.values(EnterpriseAppRoleNames);
	}
	const allowed: string[] = [];
	if (entraRoles.includes(EnterpriseAppRoleNames.ServiceLineOwner)) {
		allowed.push(EnterpriseAppRoleNames.ServiceLineOwner, EnterpriseAppRoleNames.CaseManager);
	}
	if (entraRoles.includes(EnterpriseAppRoleNames.CaseManager) && !allowed.includes(EnterpriseAppRoleNames.CaseManager)) {
		allowed.push(EnterpriseAppRoleNames.CaseManager);
	}
	if (entraRoles.includes(EnterpriseAppRoleNames.Finance)) {
		allowed.push(EnterpriseAppRoleNames.Finance);
	}
	return allowed;
}

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
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			try {
				const entraRoles = jwt.roles ?? [];
				const allowedEnterpriseAppRoles = getAllowedEnterpriseAppRoles(entraRoles);
				const requestedEnterpriseAppRole = args.input.enterpriseAppRole ?? '';
				if (requestedEnterpriseAppRole && !allowedEnterpriseAppRoles.includes(requestedEnterpriseAppRole)) {
					return { status: { success: false, errorMessage: `You do not have permission to create a role for enterprise app role type: ${requestedEnterpriseAppRole}` } };
				}
				const staffRole = await context.applicationServices.User.StaffRole.create({
					roleName: args.input.roleName,
					...(requestedEnterpriseAppRole ? { enterpriseAppRole: requestedEnterpriseAppRole } : {}),
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
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			try {
				const entraRoles = jwt.roles ?? [];
				const allowedEnterpriseAppRoles = getAllowedEnterpriseAppRoles(entraRoles);
				const isTechAdmin = entraRoles.includes(EnterpriseAppRoleNames.TechAdmin);

				if (!isTechAdmin) {
					const allRoles = await context.applicationServices.User.StaffRole.list();
					const roleToAssign = allRoles.find((r) => String(r.id) === String(args.input.roleId));
					if (!roleToAssign) {
						return { status: { success: false, errorMessage: 'Role not found' } };
					}
					if (!allowedEnterpriseAppRoles.includes(roleToAssign.enterpriseAppRole)) {
						return { status: { success: false, errorMessage: `You do not have permission to assign roles of type: ${roleToAssign.enterpriseAppRole}` } };
					}
				}

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
