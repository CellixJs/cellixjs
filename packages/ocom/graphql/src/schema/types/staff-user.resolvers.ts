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
			await context.applicationServices.User.StaffRole.createDefaultRoles();
			return await context.applicationServices.User.StaffRole.list();
		},

		staffRoleById: async (_parent, args: { id: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.User.StaffRole.queryById({ roleId: String(args.id) });
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
		staffRoleCreate: async (_parent, args: { input: { roleName: string; enterpriseAppRole?: string | null; permissions?: { communityPermissions?: { canManageCommunities?: boolean | null; canManageStaffRolesAndPermissions?: boolean | null; canManageAllCommunities?: boolean | null; canDeleteCommunities?: boolean | null; canChangeCommunityOwner?: boolean | null; canReIndexSearchCollections?: boolean | null } | null; userPermissions?: { canManageUsers?: boolean | null; canAssignStaffRoles?: boolean | null; canAssignStaffUserRoles?: boolean | null; canViewStaffUsers?: boolean | null } | null; staffRolePermissions?: { canViewRoles?: boolean | null; canAddRole?: boolean | null; canEditRole?: boolean | null; canRemoveRole?: boolean | null } | null; financePermissions?: { canManageFinance?: boolean | null; canViewGLBatchSummaries?: boolean | null; canViewFinanceConfigs?: boolean | null; canCreateFinanceConfigs?: boolean | null } | null; techAdminPermissions?: { canManageTechAdmin?: boolean | null; canViewDatabaseExplorer?: boolean | null; canViewBlobExplorer?: boolean | null; canViewQueueDashboard?: boolean | null; canSendQueueMessages?: boolean | null } | null } | null } }, context: GraphContext, _info: GraphQLResolveInfo) => {
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
							canAssignStaffRoles: args.input.permissions?.userPermissions?.canAssignStaffRoles ?? args.input.permissions?.userPermissions?.canAssignStaffUserRoles ?? false,
							canAssignStaffUserRoles: args.input.permissions?.userPermissions?.canAssignStaffUserRoles ?? args.input.permissions?.userPermissions?.canAssignStaffRoles ?? false,
							canViewStaffUsers: args.input.permissions?.userPermissions?.canViewStaffUsers ?? false,
						},
						staffRole: {
							canViewRoles: args.input.permissions?.staffRolePermissions?.canViewRoles ?? false,
							canAddRole: args.input.permissions?.staffRolePermissions?.canAddRole ?? false,
							canEditRole: args.input.permissions?.staffRolePermissions?.canEditRole ?? false,
							canRemoveRole: args.input.permissions?.staffRolePermissions?.canRemoveRole ?? false,
						},
						finance: {
							canManageFinance: args.input.permissions?.financePermissions?.canManageFinance ?? false,
							canViewGLBatchSummaries: args.input.permissions?.financePermissions?.canViewGLBatchSummaries ?? false,
							canViewFinanceConfigs: args.input.permissions?.financePermissions?.canViewFinanceConfigs ?? false,
							canCreateFinanceConfigs: args.input.permissions?.financePermissions?.canCreateFinanceConfigs ?? false,
						},
						techAdmin: {
							canManageTechAdmin: args.input.permissions?.techAdminPermissions?.canManageTechAdmin ?? false,
							canViewDatabaseExplorer: args.input.permissions?.techAdminPermissions?.canViewDatabaseExplorer ?? false,
							canViewBlobExplorer: args.input.permissions?.techAdminPermissions?.canViewBlobExplorer ?? false,
							canViewQueueDashboard: args.input.permissions?.techAdminPermissions?.canViewQueueDashboard ?? false,
							canSendQueueMessages: args.input.permissions?.techAdminPermissions?.canSendQueueMessages ?? false,
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

		staffRoleUpdate: async (_parent, args: { input: { id: string; roleName: string; enterpriseAppRole: string; permissions?: { communityPermissions?: { canManageCommunities?: boolean | null; canManageStaffRolesAndPermissions?: boolean | null; canManageAllCommunities?: boolean | null; canDeleteCommunities?: boolean | null; canChangeCommunityOwner?: boolean | null; canReIndexSearchCollections?: boolean | null } | null; userPermissions?: { canManageUsers?: boolean | null; canAssignStaffRoles?: boolean | null; canAssignStaffUserRoles?: boolean | null; canViewStaffUsers?: boolean | null } | null; staffRolePermissions?: { canViewRoles?: boolean | null; canAddRole?: boolean | null; canEditRole?: boolean | null; canRemoveRole?: boolean | null } | null; financePermissions?: { canManageFinance?: boolean | null; canViewGLBatchSummaries?: boolean | null; canViewFinanceConfigs?: boolean | null; canCreateFinanceConfigs?: boolean | null } | null; techAdminPermissions?: { canManageTechAdmin?: boolean | null; canViewDatabaseExplorer?: boolean | null; canViewBlobExplorer?: boolean | null; canViewQueueDashboard?: boolean | null; canSendQueueMessages?: boolean | null } | null } | null } }, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			try {
				const entraRoles = jwt.roles ?? [];
				const allowedEnterpriseAppRoles = getAllowedEnterpriseAppRoles(entraRoles);
				if (!allowedEnterpriseAppRoles.includes(args.input.enterpriseAppRole)) {
					return { status: { success: false, errorMessage: `You do not have permission to update a role for enterprise app role type: ${args.input.enterpriseAppRole}` } };
				}
				const communityPerms = args.input.permissions?.communityPermissions;
				const userPerms = args.input.permissions?.userPermissions;
				const staffRole = await context.applicationServices.User.StaffRole.update({
					roleId: String(args.input.id),
					roleName: args.input.roleName,
					...(args.input.enterpriseAppRole ? { enterpriseAppRole: args.input.enterpriseAppRole } : {}),
					permissions: {
						community: {
							...(communityPerms?.canManageCommunities != null ? { canManageCommunities: communityPerms.canManageCommunities } : {}),
							...(communityPerms?.canManageStaffRolesAndPermissions != null ? { canManageStaffRolesAndPermissions: communityPerms.canManageStaffRolesAndPermissions } : {}),
							...(communityPerms?.canManageAllCommunities != null ? { canManageAllCommunities: communityPerms.canManageAllCommunities } : {}),
							...(communityPerms?.canDeleteCommunities != null ? { canDeleteCommunities: communityPerms.canDeleteCommunities } : {}),
							...(communityPerms?.canChangeCommunityOwner != null ? { canChangeCommunityOwner: communityPerms.canChangeCommunityOwner } : {}),
							...(communityPerms?.canReIndexSearchCollections != null ? { canReIndexSearchCollections: communityPerms.canReIndexSearchCollections } : {}),
						},
						user: {
							...(userPerms?.canManageUsers != null ? { canManageUsers: userPerms.canManageUsers } : {}),
							...(userPerms?.canAssignStaffRoles != null ? { canAssignStaffRoles: userPerms.canAssignStaffRoles } : {}),
							...(userPerms?.canAssignStaffUserRoles != null ? { canAssignStaffRoles: userPerms.canAssignStaffUserRoles, canAssignStaffUserRoles: userPerms.canAssignStaffUserRoles } : {}),
							...(userPerms?.canViewStaffUsers != null ? { canViewStaffUsers: userPerms.canViewStaffUsers } : {}),
						},
						staffRole: {
							...(args.input.permissions?.staffRolePermissions?.canViewRoles != null ? { canViewRoles: args.input.permissions.staffRolePermissions.canViewRoles } : {}),
							...(args.input.permissions?.staffRolePermissions?.canAddRole != null ? { canAddRole: args.input.permissions.staffRolePermissions.canAddRole } : {}),
							...(args.input.permissions?.staffRolePermissions?.canEditRole != null ? { canEditRole: args.input.permissions.staffRolePermissions.canEditRole } : {}),
							...(args.input.permissions?.staffRolePermissions?.canRemoveRole != null ? { canRemoveRole: args.input.permissions.staffRolePermissions.canRemoveRole } : {}),
						},
						finance: {
							...(args.input.permissions?.financePermissions?.canManageFinance != null ? { canManageFinance: args.input.permissions.financePermissions.canManageFinance } : {}),
							...(args.input.permissions?.financePermissions?.canViewGLBatchSummaries != null ? { canViewGLBatchSummaries: args.input.permissions.financePermissions.canViewGLBatchSummaries } : {}),
							...(args.input.permissions?.financePermissions?.canViewFinanceConfigs != null ? { canViewFinanceConfigs: args.input.permissions.financePermissions.canViewFinanceConfigs } : {}),
							...(args.input.permissions?.financePermissions?.canCreateFinanceConfigs != null ? { canCreateFinanceConfigs: args.input.permissions.financePermissions.canCreateFinanceConfigs } : {}),
						},
						techAdmin: {
							...(args.input.permissions?.techAdminPermissions?.canManageTechAdmin != null ? { canManageTechAdmin: args.input.permissions.techAdminPermissions.canManageTechAdmin } : {}),
							...(args.input.permissions?.techAdminPermissions?.canViewDatabaseExplorer != null ? { canViewDatabaseExplorer: args.input.permissions.techAdminPermissions.canViewDatabaseExplorer } : {}),
							...(args.input.permissions?.techAdminPermissions?.canViewBlobExplorer != null ? { canViewBlobExplorer: args.input.permissions.techAdminPermissions.canViewBlobExplorer } : {}),
							...(args.input.permissions?.techAdminPermissions?.canViewQueueDashboard != null ? { canViewQueueDashboard: args.input.permissions.techAdminPermissions.canViewQueueDashboard } : {}),
							...(args.input.permissions?.techAdminPermissions?.canSendQueueMessages != null ? { canSendQueueMessages: args.input.permissions.techAdminPermissions.canSendQueueMessages } : {}),
						},
					},
				});
				return { status: { success: true }, staffRole };
			} catch (error) {
				console.error('StaffRole > staffRoleUpdate: ', error);
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

		staffUserCreate: async (_parent, args: { input: { firstName: string; lastName: string; email: string; roleId?: string | null } }, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			try {
				const currentUser = await context.applicationServices.User.StaffUser.queryByExternalId({ externalId: jwt.sub });
				const canManageUsers = currentUser?.role?.permissions.userPermissions.canManageUsers ?? false;
				const canManageTechAdmin = currentUser?.role?.permissions.techAdminPermissions.canManageTechAdmin ?? false;
				if (!canManageUsers && !canManageTechAdmin) {
					return { status: { success: false, errorMessage: 'Unauthorized' } };
				}

				const roleId = args.input.roleId ? String(args.input.roleId) : null;
				if (roleId) {
					const entraRoles = jwt.roles ?? [];
					const allowedEnterpriseAppRoles = getAllowedEnterpriseAppRoles(entraRoles);
					const isTechAdmin = entraRoles.includes(EnterpriseAppRoleNames.TechAdmin);

					if (!isTechAdmin) {
						const roleToAssign = await context.applicationServices.User.StaffRole.queryById({ roleId });
						if (!roleToAssign) {
							return { status: { success: false, errorMessage: 'Role not found' } };
						}
						if (!allowedEnterpriseAppRoles.includes(roleToAssign.enterpriseAppRole)) {
							return { status: { success: false, errorMessage: `You do not have permission to assign roles of type: ${roleToAssign.enterpriseAppRole}` } };
						}
					}
				}

				const staffUser = await context.applicationServices.User.StaffUser.create({
					firstName: args.input.firstName,
					lastName: args.input.lastName,
					email: args.input.email,
					roleId,
				});
				return { status: { success: true }, staffUser };
			} catch (error) {
				console.error('StaffUser > staffUserCreate: ', error);
				const { message } = error as Error;
				return { status: { success: false, errorMessage: message } };
			}
		},
	},
};

export default staffUser;
