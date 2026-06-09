import type { GraphQLResolveInfo } from 'graphql';
import type { Resolvers, RequireFields, MutationStaffRoleCreateArgs, MutationStaffRoleUpdateArgs, MutationStaffUserAssignRoleArgs } from '../builder/generated.ts';
import type { StaffRoleCreateCommand } from '../../../../application-services/src/contexts/user/staff-role/create.js';
import type { StaffRoleUpdateCommand } from '../../../../application-services/src/contexts/user/staff-role/update.js';
import type { StaffUserAssignRoleCommand } from '../../../../application-services/src/contexts/user/staff-user/assign-role.js';
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
	StaffUserActivityDetail: {
		activityByStaffUserDisplayName: async (parent, _args, context: GraphContext) => {
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
		staffRoleCreate: async (_parent, args: RequireFields<MutationStaffRoleCreateArgs, 'input'>, context: GraphContext, _info: GraphQLResolveInfo) => {
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
				// Map GraphQL input shape to application service command shape
				const command = args.input as unknown as StaffRoleCreateCommand;
				const staffRole = await context.applicationServices.User.StaffRole.create(command);
				return { status: { success: true }, staffRole };
			} catch (error) {
				console.error('StaffRole > staffRoleCreate: ', error);
				const { message } = error as Error;
				return { status: { success: false, errorMessage: message } };
			}
		},

		staffRoleUpdate: async (_parent, args: RequireFields<MutationStaffRoleUpdateArgs, 'input'>, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			try {
				// Forward update command to application service; application service enforces permissions and validation
				const command = args.input as unknown as StaffRoleUpdateCommand;
				const staffRole = await context.applicationServices.User.StaffRole.update(command);
				return { status: { success: true }, staffRole };
			} catch (error) {
				console.error('StaffRole > staffRoleUpdate: ', error);
				const { message } = error as Error;
				return { status: { success: false, errorMessage: message } };
			}
		},


		staffUserAssignRole: async (_parent, args: RequireFields<MutationStaffUserAssignRoleArgs, 'input'>, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
			return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			try {
			// Resolve actor id from JWT and forward to application service
			const actorStaffUser = await context.applicationServices.User.StaffUser.queryByExternalId({ externalId: jwt.sub });
			const actorStaffUserId = actorStaffUser?.id ?? jwt.sub;

			const command = {
				staffUserId: String(args.input.staffUserId),
				roleId: String(args.input.roleId),
				actorStaffUserId,
			} as unknown as StaffUserAssignRoleCommand;

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
