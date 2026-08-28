import { GraphQLError, type GraphQLResolveInfo } from 'graphql';
import type { Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';
import { buildDatabaseDocumentsQueryCommand } from '@ocom/application-services';

function unauthorizedError() {
	return new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
}

function userInputError(message: string) {
	return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}

const techAdminResolvers: Resolvers = {
	Query: {
		techAdminDatabaseCollections: async (_parent: unknown, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				throw unauthorizedError();
			}

			const staff = await context.applicationServices.User.StaffUser.queryByExternalId({ externalId: jwt.sub });

			const canView = staff?.role?.permissions?.techAdminPermissions?.canViewDatabaseDocuments === true;
			const canManage = staff?.role?.permissions?.techAdminPermissions?.canManageTechAdmin === true;
			if (!canView && !canManage) {
				throw unauthorizedError();
			}

			return await context.applicationServices.TechAdmin.ListCollections();
		},

		techAdminDatabaseDocuments: async (_parent: unknown, args, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				throw unauthorizedError();
			}

			const staff = await context.applicationServices.User.StaffUser.queryByExternalId({ externalId: jwt.sub });

			const canView = staff?.role?.permissions?.techAdminPermissions?.canViewDatabaseDocuments === true;
			const canManage = staff?.role?.permissions?.techAdminPermissions?.canManageTechAdmin === true;
			if (!canView && !canManage) {
				throw unauthorizedError();
			}

			const command = (() => {
				try {
					return buildDatabaseDocumentsQueryCommand(args);
				} catch (error) {
					throw userInputError((error as Error).message);
				}
			})();
			return await context.applicationServices.TechAdmin.DatabaseDocuments(command);
		},
	},
};

export default techAdminResolvers;
