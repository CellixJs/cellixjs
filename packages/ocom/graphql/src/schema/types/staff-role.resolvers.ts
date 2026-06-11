import type { GraphQLResolveInfo } from 'graphql';
import type {
	Resolvers,
	RequireFields,
	MutationStaffRoleCreateArgs,
	MutationStaffRoleUpdateArgs,
} from '../builder/generated.ts';
import type { StaffRoleCreateCommand } from '../../../../application-services/src/contexts/user/staff-role/create.js';
import type { StaffRoleUpdateCommand } from '../../../../application-services/src/contexts/user/staff-role/update.js';
import type { GraphContext } from '../context.ts';

const EnterpriseAppRoleNames = {
	CaseManager: 'Staff.CaseManager',
	ServiceLineOwner: 'Staff.ServiceLineOwner',
	Finance: 'Staff.Finance',
	TechAdmin: 'Staff.TechAdmin',
} as const;

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

const staffRole: Resolvers = {
	Query: {
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

	},

	Mutation: {
		staffRoleCreate: async (_parent, args: RequireFields<MutationStaffRoleCreateArgs, 'input'>, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			try {
				const allowedEnterpriseAppRoles = getAllowedEnterpriseAppRoles(jwt.roles ?? []);
				const requestedEnterpriseAppRole = args.input.enterpriseAppRole ?? '';
				if (requestedEnterpriseAppRole && !allowedEnterpriseAppRoles.includes(requestedEnterpriseAppRole)) {
					return { status: { success: false, errorMessage: `You do not have permission to create a role for enterprise app role type: ${requestedEnterpriseAppRole}` } };
				}
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
				const input = args.input as unknown as Record<string, unknown>;
				const command: StaffRoleUpdateCommand = {
                    // biome-ignore lint:useLiteralKeys
					roleId: String(input['id'] ?? input['roleId']),
                    // biome-ignore lint:useLiteralKeys
					name: String(input['roleName'] ?? input['name'] ?? ''),
                    // biome-ignore lint:useLiteralKeys
					enterpriseAppRole: String(input['enterpriseAppRole'] ?? ''),
				} as unknown as StaffRoleUpdateCommand;
				const staffRole = await context.applicationServices.User.StaffRole.update(command);
				return { status: { success: true }, staffRole };
			} catch (error) {
				console.error('StaffRole > staffRoleUpdate: ', error);
				const { message } = error as Error;
				return { status: { success: false, errorMessage: message } };
			}
		},
	},
};

export default staffRole;
