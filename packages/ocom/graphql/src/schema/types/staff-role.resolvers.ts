import type { GraphQLResolveInfo } from 'graphql';
import type { MutationStaffRoleCreateArgs, MutationStaffRoleUpdateArgs, RequireFields, Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';
import { buildStaffRoleCreateCommand, buildStaffRoleUpdateCommand } from './staff-role.command-mapper.ts';

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
				const command = buildStaffRoleCreateCommand(args.input, jwt.roles ?? []);
				if ('errorMessage' in command) {
					return { status: { success: false, errorMessage: command.errorMessage } };
				}
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
				const command = buildStaffRoleUpdateCommand(args.input);
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
