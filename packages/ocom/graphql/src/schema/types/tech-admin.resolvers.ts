import { buildBlobListQueryCommand, buildDatabaseDocumentsQueryCommand } from '@ocom/application-services';
import { GraphQLError, type GraphQLResolveInfo } from 'graphql';
import type { Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

function unauthorizedError() {
	return new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
}

function userInputError(message: string) {
	return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}

function recordToKeyValues(record: Record<string, string>): { key: string; value: string }[] {
	return Object.entries(record).map(([key, value]) => ({ key, value }));
}

async function assertCanViewBlobExplorer(context: GraphContext): Promise<void> {
	const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
	if (!jwt) {
		throw unauthorizedError();
	}

	const staff = await context.applicationServices.User.StaffUser.queryByExternalId({ externalId: jwt.sub });
	const canView = staff?.role?.permissions?.techAdminPermissions?.canViewBlobExplorer === true;
	const canManage = staff?.role?.permissions?.techAdminPermissions?.canManageTechAdmin === true;
	if (!canView && !canManage) {
		throw unauthorizedError();
	}
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

		techAdminBlobContainers: async (_parent: unknown, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			await assertCanViewBlobExplorer(context);
			return await context.applicationServices.TechAdmin.ListBlobContainers();
		},

		techAdminBlobList: async (_parent: unknown, args, context: GraphContext, _info: GraphQLResolveInfo) => {
			await assertCanViewBlobExplorer(context);
			const command = (() => {
				try {
					return buildBlobListQueryCommand(args);
				} catch (error) {
					throw userInputError((error as Error).message);
				}
			})();
			const page = await context.applicationServices.TechAdmin.ListBlobHierarchy(command);
			return {
				folders: page.folders,
				blobs: page.blobs.map((blob) => ({
					name: blob.name,
					blobName: blob.blobName,
					contentType: blob.contentType ?? null,
					contentLength: blob.contentLength,
					lastModified: blob.lastModified?.toISOString() ?? null,
					metadata: recordToKeyValues(blob.metadata),
					tags: recordToKeyValues(blob.tags),
				})),
				continuationToken: page.continuationToken ?? null,
			};
		},

		techAdminBlobContent: async (_parent: unknown, args: { container: string; blobName: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			await assertCanViewBlobExplorer(context);
			const content = await context.applicationServices.TechAdmin.GetBlobContent({
				containerName: args.container,
				blobName: args.blobName,
			});
			return {
				blobName: content.blobName,
				contentType: content.contentType ?? null,
				contentLength: content.contentLength,
				lastModified: content.lastModified ?? null,
				metadata: recordToKeyValues(content.metadata),
				tags: recordToKeyValues(content.tags),
				contentBase64: content.contentBase64,
				encoding: content.encoding ?? null,
				downloadUrl: content.downloadUrl ?? null,
			};
		},
	},
};

export default techAdminResolvers;
