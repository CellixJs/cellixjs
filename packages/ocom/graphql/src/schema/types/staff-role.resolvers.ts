import type { GraphQLResolveInfo } from 'graphql';
import type { MutationStaffRoleCreateArgs, MutationStaffRoleDeleteArgs, MutationStaffRoleUpdateArgs, RequireFields, Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';
import { buildStaffRoleCreateCommand, buildStaffRoleDeleteCommand, buildStaffRoleUpdateCommand } from './staff-role.command-mapper.ts';

const REASSIGNMENT_PENDING_MESSAGE = 'Role deleted, but assigned staff users could not be reassigned; recovery will retry automatically';

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

		staffRoleDelete: async (_parent, args: RequireFields<MutationStaffRoleDeleteArgs, 'input'>, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			try {
				const actorStaffUser = await context.applicationServices.User.StaffUser.queryByExternalId({ externalId: jwt.sub });
				if (!actorStaffUser) {
					throw new Error('Current staff user not found');
				}
				const actorStaffRoleId = actorStaffUser.roleId ?? actorStaffUser.role?.id;
				const command = buildStaffRoleDeleteCommand(args.input, String(actorStaffUser.id), actorStaffRoleId ? String(actorStaffRoleId) : undefined);
				const deletionResult = await context.applicationServices.User.StaffRole.delete(command);
				if (deletionResult.reassignmentPending) {
					return { status: { success: true, errorMessage: REASSIGNMENT_PENDING_MESSAGE } };
				}
				return { status: { success: true } };
			} catch (error) {
				console.error('StaffRole > staffRoleDelete: ', error);
				const { message } = error as Error;
				return { status: { success: false, errorMessage: message } };
			}
		},
	},
};

export default staffRole;
